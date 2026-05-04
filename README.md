# OpenCode Workspace

Multi-repo workspace with shared AI tooling via a Copilot-to-OpenCode translator plugin.

## How it works

The team maintains AI config in **Copilot-native format** (e.g. a shared `mobile_ai/` directory). The `opencode_copilot_plugin` reads those files at runtime and translates them into OpenCode agents, skills, and commands — no duplication needed.

```
agents/*.agent.md  →  OpenCode agents
skills/*/SKILL.md  →  OpenCode skills + commands
conventions/       →  Referenced by skills at runtime
```

## Setup

1. Place your Copilot-native config directory in the workspace
2. Reference the plugin in `opencode.json`:
   ```json
   {
     "plugin": [["./opencode_copilot_plugin/mobile-ai.js", { "path": "./path/to/copilot-config" }]]
   }
   ```
3. Run `opencode` from the workspace root

## Config files

| File | Purpose |
|------|---------|
| `opencode.json` | Plugin, MCP servers, permissions |
| `AGENTS.md` | Workspace-level agent instructions |
| `.opencode/agents/` | Project-specific agents (not translated from Copilot) |
| `.opencode/package.json` | Plugin SDK dependency |
