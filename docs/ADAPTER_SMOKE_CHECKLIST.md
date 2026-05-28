# Adapter Smoke Checklist

Run in VS Code Extension Development Host after `npm run compile`.

## Mode and status

- [ ] On activation, status bar shows `WISP NORMAL`.
- [ ] Press `i`: status changes to `WISP INSERT`.
- [ ] In insert mode, normal typing is not intercepted.
- [ ] Press `escape`: returns to `WISP NORMAL`.
- [ ] Press `v`: status changes to `WISP SELECT`.

## Prefix handling

- [ ] Press `g` and confirm concise pending indicator appears in status bar and richer QuickPick opens.
- [ ] `g g` moves to file start without requiring Enter in the QuickPick.
- [ ] `g e` moves to file end.
- [ ] `g h` / `g l` / `g s` execute correctly without requiring Enter.
- [ ] `g w` shows visible word jump labels.
- [ ] Typing a valid two-character `g w` label selects the target word.
- [ ] `g w` in select mode extends the primary selection.
- [ ] `escape` cancels active `g w` jump labels.
- [ ] Prefix clears after completed command.
- [ ] Dismissing the prefix QuickPick clears pending prefix state.

## Core motion behavior spot-check

- [ ] `w`, `b`, `e` behave correctly across line boundaries.
- [ ] `h`/`l` and left/right arrows move from selection head without skipping active selections.
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
- [ ] `space /` opens grouped workspace search QuickPick with query, file path separators, line/column, and preview; accepting a match opens/selects it.
- [ ] `space d` opens document diagnostics picker.
- [ ] `space s` opens document symbols picker.
- [ ] `space c` toggles comment.
- [ ] `r<char>` replaces selections with a repeated character.
- [ ] `R` replaces selections with the extension-local yank register.
- [ ] `y`, `Y`, `p`, and `P` use the extension-local yank register.
- [ ] `p` pastes after collapsed cursors; `P` pastes at/before collapsed cursors.
- [ ] `space y`, `space p`, and `space P` use the system clipboard.
- [ ] `:` opens command picker, shows typed command text, and does not run `w` until Enter.
- [ ] `:` then `w` / `w!` then Enter saves current file.
- [ ] `:` then `wa` / `wa!` then Enter saves all files.
- [ ] `:` then `q` then Enter closes active editor.
- [ ] `:` then `q!` then Enter force-closes/reverts active editor.
- [ ] `:` then `qa` / `qa!` then Enter quits all / quits VS Code.
- [ ] `:` then `wq` / `wq!` then Enter saves and closes active editor.
- [ ] `:` then `wqa` / `wqa!` then Enter saves all and quits.
- [ ] `;` collapses to the primary selection.
- [ ] `u` invokes undo delegate.
- [ ] `/`, `?`, `*`, `s`, `n`, `N` share extension search state.
- [ ] `*` stores current selection/word without jumping until `n` or `N`.
- [ ] `?` sets reverse direction so `n` moves backward and `N` moves forward.
- [ ] `s` selects literal/regex matches inside current selections and defaults to previous query.
- [ ] `g d` delegates to definition command.

## Viewport reveal

- [ ] `gg`, `G`, `ge` keep cursor visible (viewport follows).

## Safety/regression

- [ ] `g w` labels using keys without normal motions, e.g. `sf`, are fully captured as jump input.
- [ ] No unexpected mode drop during prefix sequences.
- [ ] No text edits for pure motions.
- [ ] No crashes when no active editor.
