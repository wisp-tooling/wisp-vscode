# Selection Model

The extension should use a Helix/Wisp-style selection model.

## Core concepts

```ts
type Selection = {
  anchor: number
  head: number
}
```

- `anchor`: fixed side of the selection.
- `head`: moving side / cursor side.
- A cursor is a collapsed selection where `anchor === head`.
- The selected range is `min(anchor, head)..max(anchor, head)`.
- `primary` is the index of the primary selection.

Offsets are JavaScript UTF-16 string indices, matching VS Code position columns.

## Normal mode

Normal mode still operates on selections. Motions usually replace each selection with a new selection representing the target text object or character range.

Examples:

- `w` selects the next word.
- `x` selects the current line.
- `h`/`l` collapse/move to neighboring characters for simple cursor-like movement in MVP.

This is not Vim operator-pending editing. The MVP should prefer direct selection transformations.

## Select mode

Select mode extends the active selection from its anchor.

- In normal mode, motions replace selections.
- In select mode, motions move only `head` and keep `anchor` fixed.

## Multiple selections

Most commands should map over all selections independently.

Rules:

1. Apply command to each selection.
2. Normalize resulting selections.
3. Sort by start offset.
4. Merge overlapping selections for safety.
5. Preserve a valid primary selection.

The current core supports mapped motions/edits across multiple selections and normalizes results after dispatch. Primary selection preservation is currently conservative: the primary index is clamped to the normalized selection list.

## Linewise selections

Line selection should include the newline when possible.

For text:

```text
abc\ndef\n
```

On line 0, `x` should select `abc\n`.

On final line without newline, `x` selects to end of file.

## Editing selections

### Delete `d`

Delete selected ranges. If selection is collapsed, delete the character under cursor where possible.

After delete:

- text is changed
- each selection collapses to deletion start
- mode remains normal

### Change `c`

Same as delete, then enter insert mode.

For linewise selections, prefer preserving indentation later. MVP can collapse to deletion start.

## Escape behavior

- insert -> normal
- select -> normal, selection remains
- prefix pending -> clear prefix, remain current mode

## Invariants

After every command:

- `0 <= anchor <= text.length`
- `0 <= head <= text.length`
- `0 <= primary < selections.length`
- selections array is non-empty
- selections are sorted by range start
- overlapping selections are merged during normalization
