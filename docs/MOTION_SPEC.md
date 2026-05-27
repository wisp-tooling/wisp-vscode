# Motion Spec

This file defines the MVP behavior for the Wisp/Helix-style VS Code extension.

## General rules

- Motions operate on every selection.
- Normal mode motions replace selections.
- Select mode motions extend from anchor to new head.
- Offsets are UTF-16 string indices.
- Keep behavior deterministic and fixture-tested.

## Character motions

### `h` / left

Move one character left.

- normal: collapse to `max(0, selectionStart - 1)`
- select: move `head` one char left

### `l` / right

Move one character right.

- normal: collapse to `min(text.length, selectionEnd + 1)`
- select: move `head` one char right

### `j` / down

Move to the same preferred visual column on the next line.

MVP behavior:

- compute current line/column from `head`
- move to next line at `min(preferredColumn, nextLineLength)`
- preferred column is current column unless already set by a vertical motion

### `k` / up

Same as `j`, but previous line.

Horizontal and non-vertical motions clear preferred column.

## Word motions

Word chars for MVP:

```ts
/[A-Za-z0-9_]/
```

Whitespace and punctuation are separators for `w`, `b`, and `e`.

WORD motions `W`, `B`, and `E` treat any consecutive non-whitespace run as a WORD, so punctuation remains part of the selected unit.

### `w`

Select forward to the next word start.

From any offset:

1. if inside a word, move to that word end,
2. include trailing separators on the same line,
3. stop before crossing line boundaries,
4. if already at newline, move to/select first word start on next line.

In normal mode, each `w` replaces the previous selection from the previous head/end (does not keep extending from the original anchor).

### `b`

Select backward to previous word start.

From any offset:

1. move left over separators,
2. move left over word chars,
3. stop at previous word start,
4. if at a line boundary, do not carry newline/trailing whitespace into selection.

In normal mode, each `b` replaces from the previous selection start.

### `e`

Select forward to current/next word end.

From any offset:

1. if before/inside a word, move to that word end,
2. otherwise skip separators to next word and move to its end,
3. if at a line boundary, move to the next line word end without carrying newline whitespace.

In normal mode, each `e` replaces from the previous selection end.

### `W`, `B`, `E`

Capitalized WORD motions mirror `w`, `b`, and `e`, but WORD chars are any non-whitespace characters. For example, `test-string` is one WORD.

Line-boundary behavior matches lowercase word motions: trailing whitespace does not carry across newlines, and a motion at a newline moves to the next/previous line's WORD as appropriate.

## Line motions

### `x`

Select current line including newline when available.

### `%`

Select whole file.

### `g g`

Move/select first line.

MVP: in normal mode collapse to offset `0`; in select mode extend `head` to offset `0`.

### `G`

Move/select last line.

MVP: in normal mode collapse to start of last line; in select mode extend `head` to start of last line.

### `g e`

Go to end of file.

### `g h`

Go to line start. In select mode, keep `anchor` fixed and move `head`.

### `g l`

Go to line end, before newline. In select mode, keep `anchor` fixed and move `head`.

### `g s`

Go to first non-whitespace on current line. In select mode, keep `anchor` fixed and move `head`.

### `g w`

Start visible word jump mode.

- Labels visible word starts using deterministic two-character labels.
- Labels are rendered with VS Code decorations and do not mutate document text.
- Normal mode selects the target word.
- Select mode extends the primary selection toward the target word.
- `escape` cancels the jump session.
- Unknown labels cancel and show a short status message.

See `docs/GW_JUMP_MOTION.md` for implementation details.

## Match and surround motions

### `m m`

Jump to the matching bracket for `()`, `[]`, `{}`, and `<>`.

### `m s <char>`

Surround each current selection with the delimiter pair. Supported delimiters:

- `(` / `)`
- `[` / `]`
- `{` / `}`
- `<` / `>`
- `'`
- `"`
- `` ` ``

### `m i <char>` / `m a <char>`

Select inside or around the nearest enclosing delimiter pair.

Supported textobjects:

- `miw` / `maw`: word inside/around
- `miW` / `maW`: WORD inside/around
- `mip` / `map`: paragraph inside/around
- `miP` / `maP`: paragraph inside/around, equivalent to `p` for MVP

### `m d <char>` / `m r <from><to>`

Delete or replace the nearest enclosing delimiter pair around the primary selection.

MVP limitations:

- `ms<char>` supports multiple selections.
- `mi`, `ma`, `md`, and `mr` currently focus on nearest pair behavior and primary-edit behavior for delete/replace.
- Word, WORD, and paragraph textobjects are implemented without tree-sitter.
- Tree-sitter-aware matching/textobjects are deferred.

## Page motions

`ctrl-u` and `ctrl-d` delegate to VS Code page movement commands for page up/down style navigation in normal/select mode.

## Search motions

Initial extension can delegate `/`, `n`, `N` to VS Code find actions or implement simple literal search later.

Recommended MVP:

- `/`: open VS Code find widget
- `n`: next find match
- `N`: previous find match

## Diagnostics motions

Delegate to VS Code diagnostics:

- `] d`: next diagnostic
- `[ d`: previous diagnostic
- `] D`: last diagnostic
- `[ D`: first diagnostic

## LSP motions/actions

Delegate to VS Code commands:

- `g d`: definition
- `g r`: references
- `space r`: rename
- `space a`: code actions
- `space h`: hover

## Counts

Counts are supported for core motions:

- arrows
- `h/j/k/l`
- `w/b/e`
- `W/B/E`

Multi-digit counts are supported, e.g. `10h`.

Full operator/motion count semantics are deferred.
