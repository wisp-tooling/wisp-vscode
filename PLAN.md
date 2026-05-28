# Development Plan

## Completed sprint: harden the pure core

Goal: improve correctness of the dependency-light TypeScript core before building the VS Code adapter.

### In scope

- [x] Add replay coverage for edge cases:
  - [x] empty file motions/edits
  - [x] final line without trailing newline
  - [x] reversed selections
  - [x] select-mode `w`, `b`, `e`
  - [x] vertical motion at file boundaries
  - [x] multi-selection delete behavior
  - [x] multi-selection change behavior
- [x] Improve selection normalization for multiple selections:
  - [x] sort selections by range start where needed
  - [x] merge or drop overlapping selections safely
  - [x] preserve a valid primary selection
- [x] Add invariant tests for replay cases.
- [x] Ensure completed prefix commands clear pending state.
- [x] Validate after each change:
  - `npm test`
  - `npm run typecheck`
  - `npm audit`
- [x] Run doc sync before closing sprint:
  - [x] update README/docs for behavior changes
  - [x] ensure PLAN reflects completed/deferred work
  - [x] confirm dependency/security notes are current

### Acceptance criteria

- Core invariants hold after dispatch:
  - at least one selection
  - selections within UTF-16 text bounds
  - valid primary index
  - no unsafe overlapping selections after normalization
- Existing replay tests keep passing.
- New edge-case replay tests pass.
- No new dependencies are introduced.

## Working agreement

- Each progress update should end with the current next agenda item.
- Before closing any sprint, run a documentation sync so README/docs/PLAN match implementation reality.

## Current sprint: VS Code integration foundation

Goal: define a pure core boundary for delegated commands, then build the minimal VS Code extension shell around that boundary.

### In scope

- [x] Add core delegate command modeling without importing VS Code APIs into `src/core`.
- [x] Add replay/unit coverage for delegated command dispatch.
- [x] Add VS Code extension shell under `src/vscode/`.
- [x] Add package metadata/contributions/keybindings needed for the extension shell.
- [x] Add mode status bar and context updates.
- [x] Keep insert mode minimally invasive.
- [x] Review and harden initial keybinding coverage for MVP keys.
- [x] Review and harden packaging/build viability without adding a bundler.
- [x] Add local Extension Development Host launch/task scaffolding.
- [x] Validate:
  - `npm test`
  - `npm run typecheck`
  - `npm audit`
- [x] Run doc sync before closing sprint.

## Sprint status

- VS Code integration foundation: complete.
- Adapter smoke hardening (light pass): complete.

## Short-term plan (approved)

1. Word-motion expansion and navigation parity — complete
   - [x] Implement `W`, `B`, `E` motions (WORD semantics).
   - [x] Ensure `g r` reference navigation/delegation works reliably.

2. Count support and diagnostics completion — complete
   - [x] Add count support for documented MVP motions.
   - [x] Add diagnostics coverage for `[d`, `]d`, `[D`, `]D`.

3. Text object/operator expansion — next
   - Implement fuller surround and match behavior.

4. UX layer
   - [x] Implement status-bar prefix hint foundation.
   - [x] Implement VS Code QuickPick prefix popup foundation.
   - [ ] Implement richer Wisp picker UI.

5. Page movement polish — complete
   - [x] Add `ctrl-u` / `ctrl-d` page movement delegates.
   - [x] Doc sync page movement behavior.

## Current sprint

- Sprint: yank/paste essentials
  - [x] Check Helix tutor/keymap docs for `y`, `p`, `P`, and Space clipboard behavior.
  - [x] Add extension-local yank register for `y`, `p`, and `P`.
  - [x] Make `d`/`c` update the local yank register.
  - [x] Add Space clipboard delegates for yank/paste.
  - [x] Validate.
  - [x] Doc sync before closing sprint.

## Paused sprint

- Sprint: multi-selection correctness
  - [x] Move select-mode word/WORD motions from active head, including reversed selections.
  - [x] Add regression fixtures for select-mode `w`, `b`, `W`, `B` with non-collapsed selections.
  - [x] Preserve primary selection identity through normalization sorting/merging.
  - [x] Apply `mr<from><to>` surround replacement across all selections, de-duplicating shared pairs.
  - [x] Preserve primary selection identity for multi-selection `d`/`c` edits.
  - [ ] Audit additional motions/operators for primary-only or range-edge behavior.
  - [ ] Validate.
  - [ ] Doc sync before closing sprint.

## Recently completed sprint

- Sprint: Helix command-mode file commands
  - [x] Check Helix tutor command-mode docs.
  - [x] Add `:` prefix hints for save/quit commands.
  - [x] Keep `;` aligned with Helix selection-collapse behavior.
  - [x] Implement core command-mode combinations: `:w`, `:w!`, `:wa`, `:wa!`, `:q`, `:q!`, `:qa`, `:qa!`, `:wq`, `:wq!`, `:wqa`, `:wqa!`.
  - [x] Add keybinding/delegate/prefix coverage.
  - [x] Local-test in Extension Development Host.
  - [x] Validate.
  - [x] Doc sync before closing sprint.

- Sprint: readiness/publish foundation
  - [x] Add publishing checklist/playbook.
  - [x] Add initial `.vscodeignore` package exclusions.
  - [x] Record temporary org namespace: `wisp-tooling`.
  - [x] Review package metadata gaps without locking final naming decisions.
  - [x] Add release/security docs placeholders as appropriate.
  - [x] Validate.
  - [x] Doc sync before closing sprint.

- Sprint: richer Wisp picker UI
  - [x] Reduce status bar prefix noise now that QuickPick is primary.
  - [x] Improve QuickPick title, placeholder, matching, and item formatting.
  - [x] Restore `space /`, `space d`, and `space s` picker commands.
  - [x] Add custom Wisp-style picker menu to backlog.
  - [x] Local-test prefix picker flows.
  - [x] Doc sync before closing sprint.

- Sprint: search motion foundation
  - [x] Implement shared extension search state for `/`, `?`, `*`, `s`, `n`, `N`.
  - [x] Add `*` search from current selection/word without jumping.
  - [x] Add `s` select matches inside current selections via input box.
  - [x] Add `?` reverse-direction search semantics.
  - [x] Add `,` collapse-to-primary selection support.
  - [x] Polish horizontal movement from selection head.
  - [x] Add delegate/keybinding coverage.
  - [x] Local-test in Extension Development Host.
  - [x] Doc sync before closing sprint.


- Sprint: `g w` visible word jump motion
  - [x] Implement pure label generation and visible word-start helpers.
  - [x] Add pure helper tests for labels and word-start detection.
  - [x] Implement VS Code jump controller with decorations.
  - [x] Route `g w` into jump session instead of normal word motion.
  - [x] Capture two-character label input while jump is active.
  - [x] Support normal-mode replace selection and select-mode extension.
  - [x] Cancel cleanly on escape, editor/document/visibility changes.
  - [x] Validate (`npm test`, `npm run typecheck`, `npm run compile`, `npm audit`).
  - [x] Local-test in Extension Development Host.
  - [x] Doc sync before closing sprint.

- Sprint: surround and match foundation
  - [x] Define MVP surround/match command subset: `mm`, `ms<char>`, `mi<char>`, `ma<char>`, `md<char>`, `mr<from><to>`.
  - [x] Implement pure core helpers where practical.
  - [x] Delegate or adapter-handle VS Code-specific behavior only when needed.
  - [x] Add fixture/unit coverage.
  - [x] Validate (`npm test`, `npm run typecheck`, `npm run compile`, `npm audit`).
  - [x] Local-test in Extension Development Host.
  - [x] Doc sync before closing sprint.
  - [x] Doc sync textobjects `miw/W` and `mip/P`.

## Backlog

### Core behavior

- More complete multiple-selection behavior for all motions.
- Search command modeling or simple literal search, if still desirable after adapter delegation.
- Additional edit commands beyond `d`/`c`.

### VS Code extension shell

- Add VS Code extension entrypoint under `src/vscode/`.
- Add `package.json` extension contributions and keybindings.
- Add activation events and commands.
- Add mode status bar.
- Add prefix status display.

### Picker/UI

- Build a custom Wisp-style picker menu for prefix hints and project pickers.
  - Prefer a lightweight, auditable implementation.
  - Evaluate VS Code-native options first: QuickPick, editor decorations, webview.
  - If using webview, require strict CSP and no external assets/scripts.

### VS Code adapter

- Map VS Code document text/selections to `EditorState`.
- Dispatch core keys from VS Code commands.
- Apply MVP full-document replacement on text edits.
- Restore VS Code selections from core selections.
- Set VS Code context keys for mode-specific keybindings.

### VS Code delegation

- Delegate undo/redo.
- Delegate definition/references.
- Delegate diagnostics navigation.
- Delegate comment toggle.
- Delegate rename, code actions, hover.
- Delegate quick open and command palette.

### Publishing/readiness

- Add Marketplace demo screenshot/GIF to README.
- Add configurable Opinionated Wisp Mode vs standard Helix mode toggle/docs.
- Add `@vscode/vsce` only after explicit dependency approval.
- Package and test local `.vsix` before publishing.
- Authenticate locally with `npx vsce login wisp-tooling` using an Azure DevOps PAT with Marketplace Publish scope.

### Performance/security/auditability

- Review per-keypress allocations and hot paths.
- Avoid external executables and runtime dependencies.
- Keep dependency list minimal and explicitly justified.
- Optimize full-document replacement after MVP if needed.
