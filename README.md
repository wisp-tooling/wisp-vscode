# Wisp VS Code Extension Seed

Purpose: starter resources for building a pure TypeScript VS Code extension that emulates Wisp/Helix-style modal editing without depending on the `wi` executable.

This directory is intended to be copied into a new repository.

## Goals

- Implement a useful Helix/Wisp motion emulator for VS Code.
- Keep the modal editing core testable without VS Code APIs.
- Use VS Code only as an adapter for document text, selections, edits, diagnostics, commands, and UI.
- Prefer correctness for core motions over broad feature coverage.
- Keep the implementation dependency-light, auditable, performant, and secure.

## Recommended architecture

```text
src/core/        Pure TypeScript editor model, motions, commands, replay tests.
src/vscode/      VS Code extension adapter. Not included in this seed yet.
fixtures/        JSON replay cases shared by tests and future integration harnesses.
docs/            Specs and implementation guidance.
```

Core rule:

```text
VS Code APIs must not leak into src/core.
```

The VS Code adapter should:

1. read document text and selections from VS Code,
2. convert them into `EditorState`,
3. dispatch a core command/key,
4. apply returned edits/selections back to VS Code.

## Suggested setup

```sh
npm install
npm test
npm run typecheck
npm audit
```

The current project has no runtime dependencies. Development dependencies are limited to TypeScript, Node type definitions, and Vitest for fixture-backed tests.

## Current core status

The pure TypeScript core currently includes:

- normal, insert, and select modes
- `h`, `j`, `k`, `l`, arrow-equivalent movement, and delegated `ctrl-u` / `ctrl-d` page movement
- `w`, `b`, `e` word motions and `W`, `B`, `E` WORD motions with line-boundary behavior
- count prefixes for core motions, including multi-digit counts
- `x`, `%`, `gg`, `G`, `ge`, `gh`, `gl`, `gs` line/file motions
- `d` delete and `c` change edits
- match/surround foundation: `mm`, `ms<char>`, `mi<char>`, `ma<char>`, `md<char>`, `mr<from><to>`
- prefix tracking for command sequences such as `g g` / `space ?` across keypresses in the VS Code adapter
- selection normalization with clamping, sorting, and overlap merging
- replay fixtures and invariant tests for edge cases
- extension prototype with status bar, keybindings, command delegation, diagnostics navigation, viewport reveal on cursor jumps

## Important docs

- `docs/ENGINEER_HANDOFF.md`: start here.
- `docs/SELECTION_MODEL.md`: selection semantics.
- `docs/MOTION_SPEC.md`: motion behavior.
- `docs/COMMAND_MATRIX.md`: key/command priority table.
- `docs/VSCODE_ADAPTER.md`: extension integration notes.
- `docs/ADAPTER_SMOKE_CHECKLIST.md`: manual extension smoke checks.

## MVP scope

Implement first:

- modes: normal, insert, select
- motions: `h`, `j`, `k`, `l`, arrows, `w`, `b`, `e`, `W`, `B`, `E`, `x`, `%`, `gg`, `G`, `ge`, `gh`, `gl`, `gs`
- edits: `d`, `c`
- prefixes: `g`, `space`, `[`, `]`
- delegates: diagnostics, definition, references, rename, code actions, comment toggle

Defer:

- exact Wisp picker UI
- full snippet anchors
- tree-sitter
- external `wi` process integration
