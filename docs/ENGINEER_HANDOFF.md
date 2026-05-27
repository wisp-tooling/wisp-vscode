# Engineer Handoff

You are building a VS Code extension that emulates Wisp/Helix modal editing. The work machine may not allow installing arbitrary executables, so the extension must be pure TypeScript and must not require the `wi` binary.

## Main objective

Build a VS Code extension with strong Helix/Wisp-style modal editing:

- normal/insert/select modes
- selection-first motions
- multiple selections where practical
- predictable command behavior tested outside VS Code
- VS Code delegation for LSP, diagnostics, comments, folds, and command palette

## Non-goals

- Do not embed or shell out to Wisp.
- Do not build a full editor renderer.
- Do not reimplement VS Code LSP.
- Do not attempt full Helix parity in the first version.
- Do not implement Vim operator-pending grammar first.

## Development strategy

1. Implement and test `src/core` first.
2. Use JSON replay fixtures as behavior specs.
3. Add a thin VS Code adapter after core motions are stable.
4. Keep VS Code-specific behavior behind adapter interfaces.

## Key architecture

```ts
type EditorState = {
  text: string
  selections: Selection[]
  primary: number
  mode: Mode
  pending?: string[]
  preferredColumns?: Array<number | null>
}
```

Dispatch should be pure where possible:

```ts
function dispatchKey(state: EditorState, key: string): EditorState
```

For edits, return new text + selections. VS Code adapter can translate this into `WorkspaceEdit` later.

## Testing principle

Every core motion/edit should have replay tests. Invariant tests should also verify every dispatched key keeps selections in bounds, keeps `primary` valid, and avoids unsafe overlapping selections.

```json
{
  "name": "w selects next word",
  "text": "hello world\n",
  "mode": "normal",
  "selections": [{ "anchor": 0, "head": 0 }],
  "primary": 0,
  "keys": ["w"],
  "want": {
    "text": "hello world\n",
    "mode": "normal",
    "selections": [{ "anchor": 6, "head": 11 }],
    "primary": 0
  }
}
```

## Suggested first milestones

### Milestone 1: pure core

- buffer position helpers
- selection normalization
- basic dispatch
- `h/j/k/l`
- `w/b/e`
- `x/%/gg/G/gh/gl/gs`
- `d/c`
- tests passing

### Milestone 2: extension shell

- VS Code extension activation
- mode status bar
- keybindings for MVP keys
- adapter reads/writes selections
- insert mode lets VS Code type normally

### Milestone 3: VS Code delegation

- `gd`: `editor.action.revealDefinition`
- `gr`: references
- `[d` / `]d`: diagnostics
- `space c`: comment toggle
- `space a`: code actions
- `space r`: rename
- `space ?`: command palette

## Correctness priorities

1. No text loss.
2. Selections are always valid UTF-16 offsets for the selected runtime.
3. Escape always returns to normal mode.
4. Insert mode should interfere with VS Code as little as possible.
5. Normal/select commands should be deterministic and test-backed.

## Notes on offsets

This seed core uses JavaScript string indices, which are UTF-16 code units. VS Code `Position`/`Range` also use UTF-16 columns, so this is acceptable for the extension. Be explicit in docs/tests. Do not call these byte offsets in the TS implementation.
