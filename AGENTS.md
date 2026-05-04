# Agent Instructions

## Version Control

Use GitButler (`but`) for version control when available. If `but` commands fail, fall back to standard git.

## Workspace layout

This is a multi-repo workspace. Each subdirectory is an independent git repo (or static asset folder). The shared AI plugin (`mobile_ai`) provides skills, agents, commands, and conventions to all projects.

| Directory | Repo (ADO) | Description |
|-----------|------------|-------------|
| `mobile_ai/` | `Mobil.AI` | Shared AI plugin — skills, agents, conventions. See its [AGENTS.md](mobile_ai/AGENTS.md) for contribution guide. |
| `skandia_flutter/` | `Mobil.Flutter` | Main Flutter app. See its [AGENTS.md](skandia_flutter/AGENTS.md) for project-specific agents. |
| `skandia_mobil_dashboard/` | `Mobil.Dashboard` | Mobile dashboard (legacy). |
| `skandia_hackathon/` | — | Hackathon scratch projects. Not a git repo. |
| `skandia_test_webb/` | — | Firebase-hosted test web app. Not a git repo. |

## Defaults

- **ADO organization**: `Skandia`
- **ADO project**: `Sk-Se-AffarsgemensamDigitalt`
- **Primary repo**: `Mobil.Flutter` (`skandia_flutter/`)
- **Language**: Code and commits in English. Analysis output (`/analyze`) in Swedish.

## Plugin setup

A local plugin (`.opencode/plugins/mobile-ai.js`) reads Copilot-native config from `mobile_ai/` and translates it into OpenCode agents, commands, and skills at runtime. No OpenCode-specific files are stored in `mobile_ai/`.

The translation:
- `mobile_ai/agents/*.agent.md` → OpenCode agents
- `mobile_ai/skills/*/SKILL.md` → OpenCode slash commands + skills
- `granular-permissions` in SKILL.md frontmatter → fine-grained OpenCode agent permissions

## Where things live

| Concern | Location |
|---------|----------|
| Shared skills & agents (Copilot format) | `mobile_ai/agents/`, `mobile_ai/skills/` |
| Conventions (work-item templates) | `mobile_ai/conventions/` |
| OpenCode plugin (translator) | `.opencode/plugins/mobile-ai.js` |
| OpenCode workspace config | `opencode.json` |
| Project-specific agents | `.opencode/agents/` |
| Project-specific doc indexes | `skandia_flutter/docs/indexes/` |
| Analysis output (specs, drafts) | Written in the working project, never in `mobile_ai/` |
| MCP server config | `opencode.json` (workspace root) |
