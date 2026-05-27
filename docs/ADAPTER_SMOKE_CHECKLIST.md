# Adapter Smoke Checklist

Run in VS Code Extension Development Host after `npm run compile`.

## Mode and status

- [ ] On activation, status bar shows `WISP NORMAL`.
- [ ] Press `i`: status changes to `WISP INSERT`.
- [ ] In insert mode, normal typing is not intercepted.
- [ ] Press `escape`: returns to `WISP NORMAL`.
- [ ] Press `v`: status changes to `WISP SELECT`.

## Prefix handling

- [ ] Press `g` and confirm pending indicator appears in status bar and QuickPick.
- [ ] `g g` moves to file start.
- [ ] `g e` moves to file end.
- [ ] `g h` / `g l` / `g s` execute correctly.
- [ ] Prefix clears after completed command.

## Core motion behavior spot-check

- [ ] `w`, `b`, `e` behave correctly across line boundaries.
- [ ] repeated `x` extends by full lines.
- [ ] `%` selects full file.
- [ ] `ctrl-u` / `ctrl-d` page up/down in normal mode.

## Match/surround

- [ ] `m m` jumps between matching brackets.
- [ ] `m s (` surrounds the current selection with parentheses.
- [ ] `m i (` selects inside nearest parentheses.
- [ ] `m a (` selects around nearest parentheses.
- [ ] `m d (` deletes nearest surrounding parentheses.
- [ ] `m r (` `[` replaces nearest parentheses with square brackets.
- [ ] `m i w` / `m a w` select inside/around word.
- [ ] `m i W` / `m a W` select inside/around WORD.
- [ ] `m i p` / `m a P` select paragraph textobjects.

## Delegate commands

- [ ] `space ?` opens command palette.
- [ ] `space c` toggles comment.
- [ ] `u` invokes undo delegate.
- [ ] `/`, `n`, `N` drive find actions.
- [ ] `g d` delegates to definition command.

## Viewport reveal

- [ ] `gg`, `G`, `ge` keep cursor visible (viewport follows).

## Safety/regression

- [ ] No unexpected mode drop during prefix sequences.
- [ ] No text edits for pure motions.
- [ ] No crashes when no active editor.
