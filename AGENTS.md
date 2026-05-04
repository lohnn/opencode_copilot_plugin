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

The workspace-level `opencode.json` registers the `mobile_ai` plugin and MCP servers. Individual projects inherit this configuration when opened from the workspace root.

## Where things live

| Concern | Location |
|---------|----------|
| Shared skills & agents | `mobile_ai/` |
| Conventions (work-item templates) | `mobile_ai/conventions/` |
| Project-specific agents | `skandia_flutter/.opencode/agents/` |
| Project-specific doc indexes | `skandia_flutter/docs/indexes/` |
| Analysis output (specs, drafts) | Written in the working project, never in `mobile_ai/` |
| MCP server config | `opencode.json` (workspace root) |
