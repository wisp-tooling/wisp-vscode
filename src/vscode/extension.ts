import * as vscode from 'vscode'
import { dispatch } from '../core/commands.js'
import { prefixHints } from '../core/prefixes.js'
import type { EditorState, Mode, Selection } from '../core/types.js'
import { delegateCommands } from './delegates.js'
import { cancelJump, handleJumpInput, jumpActive, startJump } from './jumpController.js'

let mode: Mode = 'normal'
let pending: string[] | undefined
let count: number | undefined
let status: vscode.StatusBarItem | undefined
let prefixPicker: vscode.QuickPick<PrefixPickItem> | undefined

type PrefixPickItem = vscode.QuickPickItem & { key: string }


export function activate(context: vscode.ExtensionContext): void {
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  context.subscriptions.push(status)

  context.subscriptions.push(vscode.commands.registerCommand('wisp-vscode.key', (key: string) => handleKey(key)))
  context.subscriptions.push(vscode.commands.registerCommand('wisp-vscode.enterNormal', () => handleKey('escape')))
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => cancelJump()))
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => cancelJump(vscode.window.activeTextEditor)))
  context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges((event) => cancelJump(event.textEditor)))

  void setMode('normal')
}

export function deactivate(): void {
  prefixPicker?.dispose()
  prefixPicker = undefined
  status?.dispose()
  status = undefined
}

async function handleKey(key: string): Promise<void> {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  if (jumpActive()) {
    await handleJumpInput(editor, key)
    return
  }

  const state = editorToState(editor)
  if (state.pending?.length === 1 && state.pending[0] === 'g' && key === 'w') {
    pending = undefined
    await setMode(mode, undefined)
    prefixPicker?.hide()
    startJump(editor, mode === 'select')
    return
  }

  const result = dispatch(state, key)
  mode = result.state.mode
  pending = result.state.pending
  count = result.state.count

  await applyState(editor, state, result.state)
  await setMode(result.state.mode, result.state.pending)
  showPrefixPicker(result.state.pending)

  if (result.kind === 'delegate') {
    if (result.command === 'diagnostic.first' || result.command === 'diagnostic.last') {
      await navigateDiagnosticExtreme(editor, result.command === 'diagnostic.first' ? 'first' : 'last')
      return
    }
    await vscode.commands.executeCommand(delegateCommands[result.command])
  }
}

function editorToState(editor: vscode.TextEditor): EditorState {
  const document = editor.document
  return {
    text: document.getText(),
    selections: editor.selections.map((selection) => selectionToCore(document, selection)),
    primary: Math.max(0, editor.selections.findIndex((selection) => selection.isEqual(editor.selection))),
    mode,
    pending,
    count,
  }
}

function selectionToCore(document: vscode.TextDocument, selection: vscode.Selection): Selection {
  return {
    anchor: document.offsetAt(selection.anchor),
    head: document.offsetAt(selection.active),
  }
}

async function applyState(editor: vscode.TextEditor, previous: EditorState, next: EditorState): Promise<void> {
  if (previous.text !== next.text) {
    const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(previous.text.length))
    await editor.edit((edit) => edit.replace(fullRange, next.text))
  }

  editor.selections = next.selections.map((selection) => coreToSelection(editor.document, selection))
  editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
}

function coreToSelection(document: vscode.TextDocument, selection: Selection): vscode.Selection {
  return new vscode.Selection(document.positionAt(selection.anchor), document.positionAt(selection.head))
}

async function setMode(nextMode: Mode, pending?: string[]): Promise<void> {
  mode = nextMode
  await vscode.commands.executeCommand('setContext', 'wisp.mode', nextMode)
  updateCursorStyle(nextMode)
  if (status) {
    const prefix = pending && pending.length > 0 ? `  ${pending.join(' ')} … ${formatHints(pending)}` : ''
    status.text = `WISP ${nextMode.toUpperCase()}${prefix}`
    status.show()
  }
}

function formatHints(pending: string[]): string {
  const hints = prefixHints(pending)
  if (hints.length === 0) return ''
  return hints.map((hint) => `${hint.key} ${hint.label}`).join('  ')
}

function showPrefixPicker(nextPending: string[] | undefined): void {
  prefixPicker?.dispose()
  prefixPicker = undefined

  const hints = prefixHints(nextPending)
  if (!nextPending || hints.length === 0) return

  const picker = vscode.window.createQuickPick<PrefixPickItem>()
  let dispatched = false
  prefixPicker = picker
  picker.title = nextPending.join(' ')
  picker.placeholder = 'Type a listed key to run it immediately, or use arrows and Enter.'
  picker.matchOnDescription = true
  picker.items = hints.map((hint) => ({ label: hint.key, description: hint.label, detail: `${nextPending.join(' ')} ${hint.key}`, key: hint.key }))
  picker.onDidChangeValue((value) => {
    const typed = value.trim()
    const matched = picker.items.find((item) => item.key === typed)
    if (!matched) return
    dispatched = true
    picker.hide()
    void handleKey(matched.key)
  })
  picker.onDidAccept(() => {
    const picked = picker.selectedItems[0]
    dispatched = true
    picker.hide()
    if (picked) void handleKey(picked.key)
  })
  picker.onDidHide(() => {
    picker.dispose()
    if (prefixPicker === picker) prefixPicker = undefined
    if (!dispatched && pending) void clearPendingPrefix()
  })
  picker.show()
}

async function clearPendingPrefix(): Promise<void> {
  pending = undefined
  count = undefined
  await setMode(mode, undefined)
}

function updateCursorStyle(nextMode: Mode): void {
  const cursorStyle = nextMode === 'insert' ? vscode.TextEditorCursorStyle.Line : vscode.TextEditorCursorStyle.Block
  for (const editor of vscode.window.visibleTextEditors) {
    editor.options = { ...editor.options, cursorStyle }
  }
}

async function navigateDiagnosticExtreme(editor: vscode.TextEditor, which: 'first' | 'last'): Promise<void> {
  const diagnostics = vscode.languages
    .getDiagnostics(editor.document.uri)
    .slice()
    .sort((a, b) => editor.document.offsetAt(a.range.start) - editor.document.offsetAt(b.range.start))
  if (diagnostics.length === 0) return
  const target = which === 'first' ? diagnostics[0]! : diagnostics[diagnostics.length - 1]!
  editor.selection = new vscode.Selection(target.range.start, target.range.end)
  editor.selections = [editor.selection]
  editor.revealRange(target.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
}
