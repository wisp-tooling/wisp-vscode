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
let lastSearchQuery: string | undefined
let searchDirection: -1 | 1 = 1
let yanked: string[] | undefined

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

  if (key === 'escape' || key === 'ctrl-[') {
    cancelJump(editor)
    prefixPicker?.hide()
  }

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
  yanked = result.state.yanked

  await applyState(editor, state, result.state)
  await setMode(result.state.mode, result.state.pending)
  showPrefixPicker(result.state.pending)

  if (result.kind === 'delegate') {
    if (result.command === 'diagnostic.first' || result.command === 'diagnostic.last') {
      await navigateDiagnosticExtreme(editor, result.command === 'diagnostic.first' ? 'first' : 'last')
      return
    }
    if (result.command === 'find.open' || result.command === 'find.prevOpen') {
      await promptSearch(editor, result.command === 'find.prevOpen' ? -1 : 1)
      return
    }
    if (result.command === 'find.next' || result.command === 'find.prev') {
      await repeatSearch(editor, result.command === 'find.prev' ? -1 : 1)
      return
    }
    if (result.command === 'search.selection') {
      await searchSelection(editor)
      return
    }
    if (result.command === 'clipboard.yank') {
      await yankToClipboard(editor)
      return
    }
    if (result.command === 'clipboard.pasteAfter' || result.command === 'clipboard.pasteBefore') {
      await pasteFromClipboard(editor, result.command === 'clipboard.pasteAfter' ? 'after' : 'before')
      return
    }
    if (result.command === 'diagnostic.picker') {
      await showDiagnosticPicker(editor)
      return
    }
    if (result.command === 'file.saveAndClose' || result.command === 'file.saveAndForceClose') {
      await vscode.commands.executeCommand(delegateCommands['file.save'])
      await vscode.commands.executeCommand(result.command === 'file.saveAndForceClose' ? delegateCommands['file.forceClose'] : delegateCommands['file.close'])
      return
    }
    if (result.command === 'workbench.saveAllAndQuit') {
      await vscode.commands.executeCommand(delegateCommands['file.saveAll'])
      await vscode.commands.executeCommand(delegateCommands['workbench.quit'])
      return
    }
    if (result.command === 'search.selectInSelections') {
      await selectMatchesInSelections(editor)
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
    yanked,
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
    const prefix = pending && pending.length > 0 ? `  ${pending.join(' ')} …` : ''
    status.text = `WISP ${nextMode.toUpperCase()}${prefix}`
    status.show()
  }
}

function showPrefixPicker(nextPending: string[] | undefined): void {
  prefixPicker?.dispose()
  prefixPicker = undefined

  const hints = prefixHints(nextPending)
  if (!nextPending || hints.length === 0) return

  const picker = vscode.window.createQuickPick<PrefixPickItem>()
  let dispatched = false
  prefixPicker = picker
  const isCommandMode = nextPending[0] === ':'
  const commandText = isCommandMode ? nextPending.slice(1).join('') : ''
  const prefix = isCommandMode ? `:${commandText}` : nextPending.join(' ')
  picker.title = `Wisp ${prefix} …`
  picker.placeholder = isCommandMode
    ? 'Type a command, then press Enter. Examples: w, wa, q, qa, wq, wqa!'
    : `Type one of: ${hints.map((hint) => hint.key).join('  ')}  •  arrows + Enter also work`
  picker.matchOnDescription = true
  picker.matchOnDetail = true
  picker.ignoreFocusOut = false
  picker.value = commandText
  picker.items = hints.map((hint) => ({
    label: `$(keyboard) ${hint.key}`,
    description: hint.label,
    detail: isCommandMode ? `:${hint.key}` : `${prefix} ${hint.key}`,
    alwaysShow: true,
    key: hint.key,
  }))
  picker.onDidChangeValue((value) => {
    if (isCommandMode) return
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
    if (isCommandMode) {
      void submitCommandText(picker.value.trim() || picked?.key || '')
    } else if (picked) {
      void handleKey(picked.key)
    }
  })
  picker.onDidHide(() => {
    picker.dispose()
    if (prefixPicker === picker) prefixPicker = undefined
    if (!dispatched && pending) void clearPendingPrefix()
  })
  picker.show()
}

async function submitCommandText(text: string): Promise<void> {
  pending = [':']
  for (const char of text) await handleKey(char)
  await handleKey('enter')
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
  const diagnostics = sortedDiagnostics(editor)
  if (diagnostics.length === 0) return
  const target = which === 'first' ? diagnostics[0]! : diagnostics[diagnostics.length - 1]!
  selectDiagnostic(editor, target)
}

async function showDiagnosticPicker(editor: vscode.TextEditor): Promise<void> {
  const diagnostics = sortedDiagnostics(editor)
  if (diagnostics.length === 0) {
    void vscode.window.setStatusBarMessage('No diagnostics in current document', 1500)
    return
  }

  const picked = await vscode.window.showQuickPick(
    diagnostics.map((diagnostic) => ({
      label: `${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1} ${diagnostic.message}`,
      description: vscode.DiagnosticSeverity[diagnostic.severity],
      diagnostic,
    })),
    { placeHolder: 'Document diagnostics' },
  )
  if (picked) selectDiagnostic(editor, picked.diagnostic)
}

function sortedDiagnostics(editor: vscode.TextEditor): vscode.Diagnostic[] {
  return vscode.languages
    .getDiagnostics(editor.document.uri)
    .slice()
    .sort((a, b) => editor.document.offsetAt(a.range.start) - editor.document.offsetAt(b.range.start))
}

function selectDiagnostic(editor: vscode.TextEditor, diagnostic: vscode.Diagnostic): void {
  editor.selection = new vscode.Selection(diagnostic.range.start, diagnostic.range.end)
  editor.selections = [editor.selection]
  editor.revealRange(diagnostic.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
}

async function yankToClipboard(editor: vscode.TextEditor): Promise<void> {
  await vscode.env.clipboard.writeText(editor.selections.map((selection) => editor.document.getText(selection)).join('\n'))
}

async function pasteFromClipboard(editor: vscode.TextEditor, where: 'after' | 'before'): Promise<void> {
  const text = await vscode.env.clipboard.readText()
  if (text.length === 0) return
  const ordered = editor.selections
    .map((selection, index) => ({ selection, index, position: pastePosition(editor.document, selection, where) }))
    .sort((a, b) => editor.document.offsetAt(b.position) - editor.document.offsetAt(a.position))
  const inserted = editor.selections.map((selection) => {
    const startOffset = editor.document.offsetAt(pastePosition(editor.document, selection, where))
    return { startOffset, endOffset: startOffset + text.length }
  })
  await editor.edit((edit) => {
    for (const item of ordered) edit.insert(item.position, text)
  })
  editor.selections = inserted.map((range) => new vscode.Selection(editor.document.positionAt(range.startOffset), editor.document.positionAt(range.endOffset)))
}

function pastePosition(document: vscode.TextDocument, selection: vscode.Selection, where: 'after' | 'before'): vscode.Position {
  if (!selection.isEmpty) return where === 'after' ? selection.end : selection.start
  return where === 'after' ? document.positionAt(Math.min(document.getText().length, document.offsetAt(selection.active) + 1)) : selection.active
}

async function promptSearch(editor: vscode.TextEditor, direction: -1 | 1): Promise<void> {
  const options: vscode.InputBoxOptions = { prompt: direction > 0 ? 'Search forward' : 'Search backward' }
  if (lastSearchQuery !== undefined) options.value = lastSearchQuery
  const query = await vscode.window.showInputBox(options)
  if (!query) return
  lastSearchQuery = query
  searchDirection = direction
  selectSearchMatch(editor, query, direction)
}

async function repeatSearch(editor: vscode.TextEditor, direction: -1 | 1): Promise<void> {
  const effectiveDirection = direction * searchDirection as -1 | 1
  if (!lastSearchQuery) {
    await vscode.commands.executeCommand(effectiveDirection > 0 ? delegateCommands['find.next'] : delegateCommands['find.prev'])
    return
  }
  selectSearchMatch(editor, lastSearchQuery, effectiveDirection)
}

async function searchSelection(editor: vscode.TextEditor): Promise<void> {
  const originalSelections = editor.selections
  let selected = editor.document.getText(editor.selection)
  if (selected.length === 0) {
    const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z0-9_]+/)
    if (!range) return
    selected = editor.document.getText(range)
  }
  if (selected.length === 0) return
  lastSearchQuery = selected
  searchDirection = 1
  editor.selections = originalSelections
}

async function selectMatchesInSelections(editor: vscode.TextEditor): Promise<void> {
  const options: vscode.InputBoxOptions = { prompt: 'Select matches inside current selections', placeHolder: 'literal text or /regex/' }
  if (lastSearchQuery !== undefined) options.value = lastSearchQuery
  const query = await vscode.window.showInputBox(options)
  if (!query) return
  lastSearchQuery = query
  const matcher = createMatcher(query)
  const next: vscode.Selection[] = []

  for (const selection of editor.selections) {
    const text = editor.document.getText(selection)
    const base = editor.document.offsetAt(selection.start)
    for (const match of findMatches(text, matcher)) {
      const start = editor.document.positionAt(base + match.start)
      const end = editor.document.positionAt(base + match.end)
      next.push(new vscode.Selection(start, end))
    }
  }

  if (next.length === 0) {
    void vscode.window.setStatusBarMessage(`No matches: ${query}`, 1500)
    return
  }
  editor.selections = next
  editor.revealRange(next[0]!, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
}

type Matcher = { kind: 'literal'; value: string } | { kind: 'regex'; value: RegExp }

function createMatcher(query: string): Matcher {
  if (query.length > 2 && query.startsWith('/') && query.endsWith('/')) {
    return { kind: 'regex', value: new RegExp(query.slice(1, -1), 'gu') }
  }
  return { kind: 'literal', value: query }
}

function selectSearchMatch(editor: vscode.TextEditor, query: string, direction: -1 | 1, explicitStart?: number): void {
  const text = editor.document.getText()
  const matcher = createMatcher(query)
  const matches = findMatches(text, matcher)
  if (matches.length === 0) {
    void vscode.window.setStatusBarMessage(`No matches: ${query}`, 1500)
    return
  }

  const active = explicitStart ?? editor.document.offsetAt(editor.selection.active)
  const found = direction > 0
    ? (matches.find((match) => match.start > active) ?? matches[0]!)
    : (findLastMatchBefore(matches, active) ?? matches[matches.length - 1]!)
  const start = editor.document.positionAt(found.start)
  const end = editor.document.positionAt(found.end)
  editor.selection = new vscode.Selection(start, end)
  editor.selections = [editor.selection]
  editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
}

function findLastMatchBefore(matches: Array<{ start: number; end: number }>, offset: number): { start: number; end: number } | undefined {
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]!
    if (match.end < offset) return match
  }
  return undefined
}

function findMatches(text: string, matcher: Matcher): Array<{ start: number; end: number }> {
  if (matcher.kind === 'literal') {
    const matches: Array<{ start: number; end: number }> = []
    let index = 0
    while (matcher.value.length > 0) {
      const found = text.indexOf(matcher.value, index)
      if (found < 0) break
      matches.push({ start: found, end: found + matcher.value.length })
      index = found + Math.max(1, matcher.value.length)
    }
    return matches
  }

  const matches: Array<{ start: number; end: number }> = []
  matcher.value.lastIndex = 0
  for (const match of text.matchAll(matcher.value)) {
    const start = match.index ?? 0
    const value = match[0]
    if (value.length === 0) continue
    matches.push({ start, end: start + value.length })
  }
  return matches
}
