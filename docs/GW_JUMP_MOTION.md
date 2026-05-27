# `g w` Jump Motion Implementation Guide

This document describes how to implement Wisp's `g w` motion in a pure TypeScript VS Code extension.

`g w` is a visible word-start jump command:

1. user presses `g w`,
2. extension labels visible word starts with two-character labels,
3. user types the two label characters,
4. extension selects/jumps to the target word,
5. labels disappear.

This should be implemented inside the extension rather than delegated to another extension so keybinding behavior is predictable and does not clash with existing VS Code modal/keymap extensions.

## Desired behavior

### Normal mode

- `g w` starts a jump session.
- Visible word starts are decorated with labels.
- Typing a valid two-character label selects the target word.
- Typing `escape` cancels the session.
- Unknown labels cancel the session and show a small message.

### Select mode

- `g w` starts a jump session with `extend = true`.
- Accepting a label extends the primary selection toward the target word.
- This mirrors Wisp's behavior: normal mode replaces the selection; select mode extends it.

### Insert mode

- Do not trigger `g w` from insert mode.
- Insert mode should preserve normal VS Code typing behavior.

## Wisp behavior to preserve

Wisp's terminal implementation evolved around a few important rules:

1. **Label only visible word starts.** Hidden/folded content must not receive labels.
2. **Use stable deterministic labels.** Labels are assigned in visual/top-to-bottom, left-to-right order.
3. **Use two-character labels.** Single-character labels clash too easily and cap the target count too low.
4. **Jump target selects the whole word.** It does not simply place a cursor on the first character.
5. **Selection mode extends instead of replacing.**
6. **Cancel cleanly.** Escape removes decorations and pending input.
7. **Do not mutate document text.** Labels are UI decorations only.

## Label alphabet

Use the same label generation as Wisp:

```ts
const alphabet = 'asdfghjklqwertyuiopzxcvbnm'
```

Generate labels as Cartesian pairs:

```ts
export function jumpLabelNames(): string[] {
  const alphabet = 'asdfghjklqwertyuiopzxcvbnm'
  const labels: string[] = []
  for (const a of alphabet) {
    for (const b of alphabet) labels.push(a + b)
  }
  return labels
}
```

This gives 676 labels, enough for normal visible viewport use.

## Word-start detection

Use Wisp's MVP word character rule:

```ts
function isJumpWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch)
}
```

A label target is a position where:

```ts
isJumpWordChar(current) && !isJumpWordChar(previous)
```

Line starts count as non-word previous characters.

For VS Code, operate on document text by line and UTF-16 columns, not bytes.

## Visibility rules in VS Code

Use `TextEditor.visibleRanges` as the source of truth.

Recommended MVP:

- scan only ranges returned by `editor.visibleRanges`,
- skip empty ranges,
- for each visible line, scan from visible range start character to visible range end character,
- assign labels in range order.

Important: VS Code visible ranges may include lines hidden by editor folding differently depending on API behavior. Prefer using `visibleRanges`; do not scan the whole file.

Pseudo-code:

```ts
type JumpTarget = {
  label: string
  range: vscode.Range       // decoration location for label
  wordRange: vscode.Range   // selected after accepting label
}

function collectJumpTargets(editor: vscode.TextEditor): JumpTarget[] {
  const labels = jumpLabelNames()
  const targets: JumpTarget[] = []

  for (const visible of editor.visibleRanges) {
    for (let lineNo = visible.start.line; lineNo <= visible.end.line; lineNo++) {
      const line = editor.document.lineAt(lineNo)
      const from = lineNo === visible.start.line ? visible.start.character : 0
      const to = lineNo === visible.end.line ? visible.end.character : line.text.length

      let atWord = false
      if (from > 0) atWord = isJumpWordChar(line.text[from - 1])

      for (let ch = from; ch < Math.min(to, line.text.length); ch++) {
        const word = isJumpWordChar(line.text[ch])
        if (word && !atWord) {
          const label = labels[targets.length]
          if (!label) return targets

          const start = new vscode.Position(lineNo, ch)
          const wordEnd = findWordEnd(line.text, ch)
          targets.push({
            label,
            range: new vscode.Range(start, start),
            wordRange: new vscode.Range(lineNo, ch, lineNo, wordEnd),
          })
        }
        atWord = word
      }
    }
  }

  return targets
}
```

## Decoration strategy

Use VS Code decorations. Do not insert text into the document.

Recommended approach:

- create one `TextEditorDecorationType` for all labels,
- use `before` decoration text at each word start,
- style with a high-contrast foreground and subtle background/border,
- keep labels compact.

Example:

```ts
const jumpDecoration = vscode.window.createTextEditorDecorationType({
  before: {
    color: new vscode.ThemeColor('editor.background'),
    backgroundColor: new vscode.ThemeColor('editorWarning.foreground'),
    fontWeight: 'bold',
    margin: '0 1px 0 0',
  },
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
})
```

Decoration options:

```ts
const decorations = targets.map((t) => ({
  range: t.range,
  renderOptions: {
    before: { contentText: t.label },
  },
}))

editor.setDecorations(jumpDecoration, decorations)
```

Potential issue: `before` decorations shift visual text. That is acceptable for MVP. If it feels too jumpy, use `after` on the previous character or a thinner style later.

## Jump session state

Keep jump state in the extension controller, not the pure core.

```ts
type JumpSession = {
  active: true
  extend: boolean
  pending: string
  targets: JumpTarget[]
  decoration: vscode.TextEditorDecorationType
}
```

Start:

```ts
function startJump(editor: vscode.TextEditor, extend: boolean) {
  const targets = collectJumpTargets(editor)
  renderJumpDecorations(editor, targets)
  jumpSession = { active: true, extend, pending: '', targets, decoration: jumpDecoration }
  setModeStatus('JUMP')
}
```

Cancel:

```ts
function cancelJump(editor: vscode.TextEditor) {
  editor.setDecorations(jumpDecoration, [])
  jumpSession = undefined
  restorePreviousModeStatus()
}
```

## Capturing label input

You need to capture normal letter keys while a jump session is active.

Recommended keybinding strategy:

- route normal/select keybindings through a single command such as `wisp-vscode.key`,
- when `jumpSession` is active, `wisp-vscode.key` sends the key to `handleJumpInput`,
- define keybindings for label alphabet characters in normal/select contexts.

Example package.json keybinding shape:

```json
{
  "key": "a",
  "command": "wisp-vscode.key",
  "args": "a",
  "when": "editorTextFocus && wisp.mode != insert"
}
```

Because labels only use lowercase alphabet characters, make sure those keys are captured while not in insert mode.

Input handler:

```ts
async function handleJumpInput(editor: vscode.TextEditor, key: string) {
  if (!jumpSession) return

  if (key === 'escape') {
    cancelJump(editor)
    return
  }

  if (!/^[a-z]$/.test(key)) return

  jumpSession.pending += key
  if (jumpSession.pending.length < 2) return

  const label = jumpSession.pending
  const target = jumpSession.targets.find((t) => t.label === label)
  cancelJump(editor)

  if (!target) {
    vscode.window.setStatusBarMessage(`Unknown jump label: ${label}`, 1500)
    return
  }

  applyJumpTarget(editor, target, jumpSession.extend)
}
```

Be careful: in the example above `cancelJump` clears `jumpSession`; store `extend` before canceling.

## Applying the target

Normal mode:

```ts
editor.selections = [new vscode.Selection(target.wordRange.start, target.wordRange.end)]
editor.revealRange(target.wordRange, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
```

Select mode extension:

```ts
const current = editor.selection
const anchor = current.anchor
const targetStart = target.wordRange.start
const targetEnd = target.wordRange.end

// Wisp extends to the start or end depending on direction.
const anchorBeforeTarget = comparePositions(anchor, targetStart) <= 0
const active = anchorBeforeTarget ? targetEnd : targetStart
editor.selection = new vscode.Selection(anchor, active)
```

For multiple selections, MVP can update only the primary VS Code selection. Later, decide whether `g w` should apply to all selections or primary only. Wisp uses the primary selection for jump input.

## Prefix integration

`g w` is a two-key command, not a normal text input.

Flow:

1. user presses `g`, core/extension enters pending prefix state and prefix UI includes `w`,
2. user presses `w`, extension starts jump session,
3. next two key presses are consumed as jump label input,
4. session ends.

Do not send label input through normal motion dispatch.

## Handling scroll/edit during jump

Recommended MVP:

- If active editor changes: cancel jump.
- If document changes: cancel jump.
- If visible ranges change significantly: cancel jump.
- If selection changes externally: cancel jump.

This avoids stale labels and incorrect targets.

Later refinement:

- recompute labels on scroll,
- preserve pending label if possible.

## Tests to write

Pure tests:

- label generation order begins `aa`, `as`, `ad`, ...? Wait: with nested alphabet loops, order is `aa`, `as`, `ad`, `af`, ... for first outer `a`.
- labels are deterministic and unique.
- word-start detection labels only starts, not middle of words.
- punctuation and whitespace separate words.
- underscores count as word chars.

Adapter-level tests, if using VS Code extension tests:

- `g w` shows decorations for visible word starts.
- typing a valid label selects the target word.
- `escape` clears decorations.
- unknown label clears decorations and shows status message.
- select-mode jump extends selection.

Suggested pure helper test shape:

```ts
test('collects visible word starts', () => {
  const got = collectJumpTargetsFromLines(['one two', 'three_four'], [{ startLine: 0, endLine: 1 }])
  expect(got.map(t => t.label)).toEqual(['aa', 'as', 'ad'])
  expect(got.map(t => t.wordText)).toEqual(['one', 'two', 'three_four'])
})
```

## Common pitfalls

1. **Scanning the whole document.** This creates too many labels and targets hidden text.
2. **Using single-character labels.** This is too limiting and clashes with normal commands.
3. **Mutating text to show labels.** Use decorations only.
4. **Not canceling on document changes.** Stale offsets lead to wrong jumps.
5. **Ignoring folds.** Use visible ranges as much as possible.
6. **Confusing bytes and UTF-16 offsets.** VS Code positions are UTF-16.
7. **Letting label input fall through to normal commands.** Jump session must have priority in dispatch.
8. **Forgetting select mode extension.** `g w` should not always replace the selection.

## Recommended implementation files

```text
src/core/jump.ts              Pure label generation and word-start helpers.
src/vscode/jumpController.ts  VS Code decorations, sessions, input, apply target.
src/vscode/keyController.ts   Routes keys; jump session has priority.
test/jump.test.ts             Pure helper tests.
```

Keep decoration/session code out of `src/core` so the algorithm remains easy to test without VS Code.
