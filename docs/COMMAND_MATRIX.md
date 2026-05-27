# Command Matrix

Priority table for the VS Code extension.

## Legend

- Core: implement in pure TS core.
- Delegate: call VS Code command/API.
- Later: defer.

| Key | Command | Type | Priority | Notes |
| --- | --- | --- | --- | --- |
| `escape` | mode.normal/cancel | Core | P0 | Always reliable. |
| `i` | mode.insert | Core | P0 | Let VS Code type normally after mode switch. |
| `a` | mode.append | Core | P0 | Move right then insert. |
| `v` | mode.select | Core | P1 | Select mode extension semantics. |
| `h` | move.left | Core | P0 | Also arrow left. |
| `j` | move.down | Core | P0 | Also arrow down. |
| `k` | move.up | Core | P0 | Also arrow up. |
| `l` | move.right | Core | P0 | Also arrow right. |
| `w` | move.word.next | Core | P0 | Selection-first. |
| `b` | move.word.prev | Core | P0 | Selection-first. |
| `e` | move.word.end | Core | P1 | Selection-first. |
| `x` | select.line | Core | P0 | Include newline if possible. |
| `%` | select.file | Core | P0 | Whole file. |
| `d` | edit.delete | Core | P0 | Delete selections. |
| `c` | edit.change | Core | P0 | Delete then insert. |
| `u` | undo | Delegate | P0 | `undo`. |
| `U` | redo | Delegate | P1 | `redo`. |
| `g g` | goto.file.start | Core | P0 | Prefix handling needed. |
| `G` | goto.file.end | Core | P0 | Start of last line. |
| `g h` | goto.line.start | Core | P0 | |
| `g l` | goto.line.end | Core | P0 | Before newline. |
| `g s` | goto.line.firstNonWhitespace | Core | P0 | |
| `g d` | lsp.definition | Delegate | P0 | `editor.action.revealDefinition`. |
| `g r` | lsp.references | Delegate | P1 | VS Code references command. |
| `/` | search.forward | Delegate | P0 | Open find widget first. |
| `n` | search.next | Delegate | P1 | Find next. |
| `N` | search.prev | Delegate | P1 | Find previous. |
| `space f` | file.quickOpen | Delegate | P0 | `workbench.action.quickOpen`. |
| `space b` | buffer.quickOpen | Delegate | P1 | `workbench.action.showAllEditors`. |
| `space ?` | command.palette | Delegate | P0 | `workbench.action.showCommands`. |
| `space c` | comment.toggle | Delegate | P0 | `editor.action.commentLine`. |
| `space r` | lsp.rename | Delegate | P1 | `editor.action.rename`. |
| `space a` | lsp.codeActions | Delegate | P1 | `editor.action.quickFix`. |
| `space h` | lsp.hover | Delegate | P1 | `editor.action.showHover`. |
| `] d` | diagnostic.next | Delegate | P1 | VS Code marker nav. |
| `[ d` | diagnostic.prev | Delegate | P1 | VS Code marker nav. |
| `z f` | fold.close | Delegate | P2 | VS Code fold command. |
| `z o` | fold.open | Delegate | P2 | VS Code unfold command. |
| `ctrl-n` | snippet.next/completion.next | Delegate | P2 | Context dependent. |
| `ctrl-p` | snippet.prev/completion.prev | Delegate | P2 | Context dependent. |

## Prefix popup

Implement a lightweight which-key popup after prefix keys:

- `space`
- `g`
- `z`
- `m`
- `[`
- `]`

VS Code implementation options:

1. status bar text for simple MVP,
2. quick pick with matching commands,
3. webview/decorations later.

Start with status bar or quick pick. Do not block core command work on custom UI.
