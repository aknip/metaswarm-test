# Metaswarm - Notes

**Plugin dependencies configured in `.claude/settings.json`**

## About Metaswarm

https://rywalker.com/research/metaswarm
https://rywalker.com/research/autonomous-agentic-engineering-tools?__readwiseLocation=

Metaswarm is Dave Sifry's multi-agent orchestration framework for Claude Code, coordinating 18 specialized agents through an 11-phase pipeline from GitHub issue to merged PR. Its distinguishing features are cross-model adversarial review (Claude writes, Codex or Gemini reviews) and blocking quality gates that prevent FAIL→COMMIT transitions. Built on BEADS for git-native issue tracking and Superpowers for foundational workflows.
Metaswarm provides a full orchestration layer that breaks work into phases, assigns each to a specialist agent, iterates through multiple reviews, and coordinates handoffs through PR creation and shepherding.

For complex tasks with written specs, every work unit runs through a 4-phase loop:
Implement, Validate, Adversarial Review, Commit. On failure: fix, re-validate, spawn a fresh reviewer (never the same one), retry up to 3 times before escalating.
Self-Improving Knowledge Base: Metaswarm maintains a JSONL knowledge base in your repo — patterns, gotchas, architectural decisions, anti-patterns. After every merged PR, the self-reflect workflow analyzes what happened and writes new entries.

## Prerequisites (see doc on Github)

- One of: Claude Code, Gemini CLI, or Codex CLI
- BEADS CLI (bd) — Git-native issue tracking (recommended)
- GitHub CLI (gh) — For PR automation (recommended)
- Superpowers Plugin (optional, Claude Code only) 
# metaswarm-test