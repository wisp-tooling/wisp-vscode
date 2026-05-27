import * as vscode from 'vscode'
import { dispatch } from '../core/commands.js'
import type { DelegateCommand, EditorState, Mode, Selection } from '../core/types.js'

let mode: Mode = 'normal'
let pending: string[] | undefined
let status: vscode.StatusBarItem | undefined

const delegateCommands: Record<DelegateCommand, string> = {
  undo: 'undo',
  redo: 'redo',
  'find.open': 'actions.find',
  'find.next': 'editor.action.nextMatchFindAction',
  'find.prev': 'editor.action.previousMatchFindAction',
  'file.quickOpen': 'workbench.action.quickOpen',
  'buffer.quickOpen': 'workbench.action.showAllEditors',
  'command.palette': 'workbench.action.showCommands',
  'comment.toggle': 'editor.action.commentLine',
  'lsp.definition': 'editor.action.revealDefinition',
  'lsp.references': 'editor.action.referenceSearch.trigger',
  'lsp.rename': 'editor.action.rename',
  'lsp.codeActions': 'editor.action.quickFix',
  'lsp.hover': 'editor.action.showHover',
  'diagnostic.next': 'editor.action.marker.next',
  'diagnostic.prev': 'editor.action.marker.prev',
  'fold.close': 'editor.fold',
  'fold.open': 'editor.unfold',
}

export function activate(context: vscode.ExtensionContext): void {
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  context.subscriptions.push(status)

  context.subscriptions.push(vscode.commands.registerCommand('wisp-vscode.key', (key: string) => handleKey(key)))
  context.subscriptions.push(vscode.commands.registerCommand('wisp-vscode.enterNormal', () => handleKey('escape')))

  void setMode('normal')
}

export function deactivate(): void {
  status?.dispose()
  status = undefined
}

async function handleKey(key: string): Promise<void> {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  const state = editorToState(editor)
  const result = dispatch(state, key)
  mode = result.state.mode
  pending = result.state.pending

  await applyState(editor, state, result.state)
  await setMode(result.state.mode, result.state.pending)

  if (result.kind === 'delegate') {
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
  if (status) {
    const prefix = pending && pending.length > 0 ? `  ${pending.join(' ')} …` : ''
    status.text = `WISP ${nextMode.toUpperCase()}${prefix}`
    status.show()
  }
}
