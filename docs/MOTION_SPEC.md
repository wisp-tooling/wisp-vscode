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

Whitespace and punctuation are separators.

### `w`

Select next word.

From any offset:

1. if inside current word, move to its end,
2. skip separators,
3. select the next word start..end.

If there is no next word, collapse/select at EOF.

Example:

```text
hello world
^ -> w selects world
```

### `b`

Select previous word.

From any offset:

1. move left over separators,
2. move left over word chars,
3. select that word.

If there is no previous word, select/collapse at BOF.

### `e`

Select to end of current/next word.

MVP:

1. if before or inside a word, select that word,
2. otherwise skip separators and select next word.

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

### `g h`

Go to line start. In select mode, keep `anchor` fixed and move `head`.

### `g l`

Go to line end, before newline. In select mode, keep `anchor` fixed and move `head`.

### `g s`

Go to first non-whitespace on current line. In select mode, keep `anchor` fixed and move `head`.

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

MVP should support counts only for simple motions if easy. Recommended first count support:

- arrows
- `h/j/k/l`

Full operator/motion count semantics are deferred.
