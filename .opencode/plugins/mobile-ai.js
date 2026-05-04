/**
 * mobile-ai plugin for OpenCode.
 *
 * Reads Copilot-native config and translates it into OpenCode agents,
 * commands, and skills at runtime.
 *
 * Configure the source path via environment variable:
 *   MOBILE_AI_PATH=./mobile_ai  (relative to workspace root)
 *   MOBILE_AI_PATH=/absolute/path/to/mobile_ai
 *
 * Defaults to "./mobile_ai" relative to the workspace root.
 */

import path from "path";
import fs from "fs";

const MODEL_MAP = {
  "gpt-5 mini": "github-copilot/gpt-5-mini",
  "gpt-5": "github-copilot/gpt-5",
  "gpt-4.1": "github-copilot/gpt-4.1",
  "gpt-4.1 mini": "github-copilot/gpt-4.1-mini",
  "claude sonnet 4": "github-copilot/claude-sonnet-4",
  "claude sonnet 4.6": "github-copilot/claude-sonnet-4.6",
  "claude haiku 4": "github-copilot/claude-haiku-4",
  "claude opus 4": "github-copilot/claude-opus-4",
  "claude opus 4.6": "github-copilot/claude-opus-4.6",
  "gemini 2.5 pro": "github-copilot/gemini-2.5-pro",
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fmStr = match[1];
  const body = match[2];
  const frontmatter = {};

  let currentKey = null;
  let currentValue = "";
  let inMultiline = false;
  let inNestedBlock = false;
  let nestedKey = null;
  let nestedObj = {};

  function saveCurrentState() {
    if (inNestedBlock && nestedKey) {
      frontmatter[nestedKey] = nestedObj;
      inNestedBlock = false;
      nestedKey = null;
      nestedObj = {};
    } else if (currentKey) {
      frontmatter[currentKey] = currentValue.trim();
      currentKey = null;
      currentValue = "";
    }
    inMultiline = false;
  }

  function parseInlineArray(val) {
    const arrayMatch = val.match(/^\[(.*)?\]$/);
    if (!arrayMatch) return null;
    const inner = arrayMatch[1] || "";
    if (inner.trim() === "") return [];
    return inner.split(",").map((item) =>
      item.trim().replace(/^["']|["']$/g, "")
    );
  }

  for (const line of fmStr.split("\n")) {
    if (line.trim() === "") continue;

    const topMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (topMatch && !line.startsWith(" ") && !line.startsWith("\t")) {
      saveCurrentState();

      currentKey = topMatch[1];
      const val = topMatch[2].trim();

      if (val === "" || val === ">" || val === "|") {
        inMultiline = val === ">" || val === "|";
        currentValue = "";
        if (val === "") {
          inNestedBlock = true;
          nestedKey = currentKey;
          nestedObj = {};
          currentKey = null;
        }
      } else {
        inMultiline = false;
        const arr = parseInlineArray(val);
        if (arr !== null) {
          frontmatter[currentKey] = arr;
          currentKey = null;
          currentValue = "";
        } else {
          currentValue = val.replace(/^["']|["']$/g, "");
        }
      }
      continue;
    }

    if (inNestedBlock) {
      const nestedMatch = line.match(
        /^\s+([a-zA-Z_*"'-][a-zA-Z_*0-9"'-]*):\s*(.*)$/
      );
      if (nestedMatch) {
        const nk = nestedMatch[1].replace(/^["']|["']$/g, "");
        const nv = nestedMatch[2].trim().replace(/^["']|["']$/g, "");
        nestedObj[nk] = nv;
        continue;
      }
    }

    if (currentKey && (inMultiline || line.startsWith("  "))) {
      currentValue += (currentValue ? " " : "") + line.trim();
    }
  }

  saveCurrentState();
  return { frontmatter, body };
}

function readFiles(dirPath, pattern) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(pattern))
    .map((f) => {
      const content = fs.readFileSync(path.join(dirPath, f), "utf8");
      const name = f.replace(pattern, "");
      const { frontmatter, body } = parseFrontmatter(content);
      return { name, frontmatter, body };
    });
}

function mapModel(copilotModel) {
  if (!copilotModel) return undefined;
  const key = copilotModel.toLowerCase().trim();
  return MODEL_MAP[key] || `github-copilot/${key.replace(/\s+/g, "-")}`;
}

function toolsToPermissions(tools) {
  if (!tools || !Array.isArray(tools) || tools.length === 0) return undefined;
  const permission = {};
  for (const tool of tools) {
    const key = tool.replace(/\//g, "_");
    permission[key] = "allow";
  }
  permission["*"] = "deny";
  return permission;
}

function readSkillForAgent(skillsDir, agentName, agentBody) {
  const refMatch = agentBody.match(
    /\[.*?\]\(\.\.\/(skills\/[^)]+\/SKILL\.md)\)/
  );
  if (refMatch) {
    const skillPath = path.resolve(skillsDir, "..", refMatch[1]);
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, "utf8");
      const { frontmatter, body } = parseFrontmatter(content);
      return { frontmatter, body: body.trim() };
    }
  }

  const skillPath = path.join(skillsDir, agentName, "SKILL.md");
  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, "utf8");
    const { frontmatter, body } = parseFrontmatter(content);
    return { frontmatter, body: body.trim() };
  }

  return null;
}

export const MobileAiPlugin = async ({ directory }) => {
  // Resolve mobile_ai path: env var > default (./mobile_ai)
  const mobileAiRelPath = process.env.MOBILE_AI_PATH || "mobile_ai";
  const mobileAiRoot = path.isAbsolute(mobileAiRelPath)
    ? mobileAiRelPath
    : path.resolve(directory, mobileAiRelPath);
  const agentsDir = path.resolve(mobileAiRoot, "agents");
  const skillsDir = path.resolve(mobileAiRoot, "skills");

  return {
    config: async (config) => {
      try {
        // ── 1. Register skills path ──
        config.skills = config.skills || {};
        config.skills.paths = config.skills.paths || [];
        if (!config.skills.paths.includes(skillsDir)) {
          config.skills.paths.push(skillsDir);
        }

        // ── 2. Translate agents/*.agent.md → OpenCode agents ──
        const agents = readFiles(agentsDir, ".agent.md");
        config.agent = config.agent || {};
        for (const agent of agents) {
          const fm = agent.frontmatter;
          const agentKey = (fm.name || agent.name).toLowerCase();

          const skill = readSkillForAgent(skillsDir, agentKey, agent.body);
          const prompt = skill ? skill.body : agent.body.trim();

          const granularPerms = skill?.frontmatter?.["granular-permissions"];
          const permission =
            typeof granularPerms === "object"
              ? granularPerms
              : toolsToPermissions(fm.tools);

          config.agent[agentKey] = {
            description: fm.description || "",
            prompt,
            mode: fm["user-invocable"] === "false" ? "subagent" : "primary",
            ...(mapModel(fm.model) && { model: mapModel(fm.model) }),
            ...(permission && { permission }),
          };
        }

        // ── 3. Translate skills/*/SKILL.md → OpenCode commands ──
        if (fs.existsSync(skillsDir)) {
          config.command = config.command || {};
          const skillDirs = fs
            .readdirSync(skillsDir)
            .filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory());

          for (const skillDir of skillDirs) {
            const skillPath = path.join(skillsDir, skillDir, "SKILL.md");
            if (!fs.existsSync(skillPath)) continue;

            const content = fs.readFileSync(skillPath, "utf8");
            const { frontmatter: fm, body } = parseFrontmatter(content);

            if (fm["user-invocable"] === "false") continue;

            const cmdName = fm.name || skillDir;
            let template = body.trim();

            if (fm.agent) {
              const hint = fm["argument-hint"] || "$ARGUMENTS";
              template = `${hint}: $ARGUMENTS`;
            }

            config.command[cmdName] = {
              description: fm.description || "",
              template,
              ...(fm.agent && { agent: fm.agent }),
              ...(fm["context"] === "fork" && { subtask: true }),
              ...(fm.subtask === "true" && { subtask: true }),
              ...(mapModel(fm.model) && { model: mapModel(fm.model) }),
            };
          }
        }
      } catch (err) {
        // Write error to a file since console might be swallowed
        fs.writeFileSync("/tmp/mobile-ai-plugin-error.txt", err.stack || err.message || String(err));
      }
    },
  };
};

export default MobileAiPlugin;
