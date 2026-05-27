# VS Code Adapter Notes

The core should be pure TypeScript. The extension adapter maps VS Code state to core state and back.

## State mapping

### VS Code -> core

- `TextDocument.getText()` -> `EditorState.text`
- `TextEditor.selections` -> `EditorState.selections`
- active selection index -> `primary`
- extension global/current mode -> `mode`

VS Code positions use line + UTF-16 character. Convert to absolute UTF-16 offset with document offsets.

### core -> VS Code

- If text changed, apply a single full-document replacement first for MVP.
- Then set `editor.selections` from core selections.
- Later optimize edits to minimal ranges.

Full replacement is acceptable for early correctness tests but may affect undo grouping. Optimize after MVP.

## Insert mode

In insert mode, avoid intercepting normal printable typing. Let VS Code handle text input.

Intercept only:

- `escape`
- extension-specific control keys if needed

## Normal/select mode key handling

Use VS Code keybindings in `package.json` with `when` clauses based on extension context:

```json
{
  "key": "h",
  "command": "wisp-vscode.key",
  "args": "h",
  "when": "editorTextFocus && wisp.mode != insert"
}
```

Set context when mode changes:

```ts
await vscode.commands.executeCommand('setContext', 'wisp.mode', mode)
```

## Commands to delegate

Examples:

```ts
await vscode.commands.executeCommand('workbench.action.quickOpen')
await vscode.commands.executeCommand('workbench.action.showCommands')
await vscode.commands.executeCommand('editor.action.commentLine')
await vscode.commands.executeCommand('editor.action.revealDefinition')
await vscode.commands.executeCommand('editor.action.referenceSearch.trigger')
await vscode.commands.executeCommand('editor.action.rename')
await vscode.commands.executeCommand('editor.action.quickFix')
await vscode.commands.executeCommand('editor.action.showHover')
```

Verify command IDs in current VS Code docs; command names can vary.

## Diagnostics

Use VS Code APIs where direct commands are insufficient:

```ts
const diagnostics = vscode.languages.getDiagnostics(document.uri)
```

Implement diagnostic navigation by sorting diagnostics by range start and selecting the next/previous range.

## Undo/redo

Delegate:

```ts
await vscode.commands.executeCommand('undo')
await vscode.commands.executeCommand('redo')
```

For core edits applied via `TextEditor.edit`, VS Code should create undo stops. Tune later.

## Status bar

Show mode clearly:

```text
WISP NORMAL
WISP INSERT
WISP SELECT
```

Optional: show pending prefix:

```text
WISP NORMAL  space …
```

## Risks

- VS Code keybinding conflicts.
- Some keys cannot be captured reliably on all platforms.
- Multi-cursor behavior may differ from Wisp.
- Full-document replacement can affect undo/performance.
- VS Code extensions use UTF-16 positions, not bytes.
