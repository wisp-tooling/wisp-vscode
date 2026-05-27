import * as vscode from 'vscode'
import { collectJumpTargetsFromLines } from '../core/jump.js'

export type JumpTarget = {
  label: string
  range: vscode.Range
  wordRange: vscode.Range
}

type JumpSession = {
  extend: boolean
  pending: string
  targets: JumpTarget[]
  decoration: vscode.TextEditorDecorationType
}

let session: JumpSession | undefined

export function jumpActive(): boolean {
  return session !== undefined
}

export function startJump(editor: vscode.TextEditor, extend: boolean): void {
  cancelJump(editor)
  const decoration = vscode.window.createTextEditorDecorationType({
    before: {
      color: new vscode.ThemeColor('editor.background'),
      backgroundColor: new vscode.ThemeColor('editorWarning.foreground'),
      fontWeight: 'bold',
      margin: '0 1px 0 0',
    },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
  })
  const targets = collectJumpTargets(editor)
  session = { extend, pending: '', targets, decoration }
  renderJumpDecorations(editor)
}

export async function handleJumpInput(editor: vscode.TextEditor, key: string): Promise<void> {
  if (!session) return
  if (key === 'escape') {
    cancelJump(editor)
    return
  }
  if (!/^[a-z]$/.test(key)) return

  session.pending += key
  if (session.pending.length < 2) return

  const label = session.pending
  const target = session.targets.find((candidate) => candidate.label === label)
  const extend = session.extend
  cancelJump(editor)

  if (!target) {
    void vscode.window.setStatusBarMessage(`Unknown jump label: ${label}`, 1500)
    return
  }

  applyJumpTarget(editor, target, extend)
}

export function cancelJump(editor?: vscode.TextEditor): void {
  if (!session) return
  if (editor) editor.setDecorations(session.decoration, [])
  session.decoration.dispose()
  session = undefined
}

function collectJumpTargets(editor: vscode.TextEditor): JumpTarget[] {
  const lines = []
  for (const visible of editor.visibleRanges) {
    for (let lineNo = visible.start.line; lineNo <= visible.end.line; lineNo++) {
      const line = editor.document.lineAt(lineNo)
      lines.push({
        line: lineNo,
        text: line.text,
        from: lineNo === visible.start.line ? visible.start.character : 0,
        to: lineNo === visible.end.line ? visible.end.character : line.text.length,
      })
    }
  }

  return collectJumpTargetsFromLines(lines).map((target) => {
    const start = new vscode.Position(target.line, target.start)
    return {
      label: target.label,
      range: new vscode.Range(start, start),
      wordRange: new vscode.Range(target.line, target.start, target.line, target.end),
    }
  })
}

function renderJumpDecorations(editor: vscode.TextEditor): void {
  if (!session) return
  editor.setDecorations(
    session.decoration,
    session.targets.map((target) => ({ range: target.range, renderOptions: { before: { contentText: target.label } } })),
  )
}

function applyJumpTarget(editor: vscode.TextEditor, target: JumpTarget, extend: boolean): void {
  if (extend) {
    const anchor = editor.selection.anchor
    const active = comparePositions(anchor, target.wordRange.start) <= 0 ? target.wordRange.end : target.wordRange.start
    editor.selection = new vscode.Selection(anchor, active)
  } else {
    editor.selection = new vscode.Selection(target.wordRange.start, target.wordRange.end)
  }
  editor.selections = [editor.selection]
  editor.revealRange(target.wordRange, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
}

function comparePositions(a: vscode.Position, b: vscode.Position): number {
  if (a.line !== b.line) return a.line - b.line
  return a.character - b.character
}
