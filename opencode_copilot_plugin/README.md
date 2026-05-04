# OpenCode Copilot Plugin

Translates Copilot-native config (`agents/*.agent.md`, `skills/*/SKILL.md`) into OpenCode agents, commands, and skills at runtime.

This allows a team to maintain a single source of truth in Copilot format while OpenCode users get full functionality without duplicating config.

## Setup

In `opencode.json`:

```json
{
  "plugin": [["./opencode_copilot_plugin/mobile-ai.js", { "path": "./path/to/copilot-config" }]]
}
```

### Options

| Key    | Description                                      | Default        |
|--------|--------------------------------------------------|----------------|
| `path` | Path to the Copilot config directory (relative or absolute) | `"mobile_ai"` |

## What it does

1. **Skills** — Registers `<config>/skills/` as a skill search path
2. **Agents** — Reads `<config>/agents/*.agent.md` and translates each into an OpenCode agent with matching model, instructions, and permissions
3. **Permissions** — Maps `granular-permissions` from SKILL.md frontmatter into OpenCode's permission rules (last-match-wins ordering)

## Copilot format reference

### Agent files (`agents/<name>.agent.md`)

```yaml
---
name: my-agent
description: What this agent does
model: claude sonnet 4
tools:
  - read
  - glob
---

System prompt / instructions go here.
```

### Skill files (`skills/<name>/SKILL.md`)

```yaml
---
description: When to use this skill
user-invocable: false
granular-permissions:
  - "bash(az *)": deny
  - "azure-devops_*": allow
---

Skill instructions go here.
```

## Development

The plugin is a standard ES module. It exports `MobileAiPlugin` which receives:

- `ctx` — OpenCode context (`{ directory, worktree, client, ... }`)
- `options` — The options object from the tuple in `opencode.json`

Returns a `{ config }` hook that mutates the OpenCode config at startup.
