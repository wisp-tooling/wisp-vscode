import { moveLeft, moveRight, moveVertical, moveWordNext, moveWordPrev, moveWordEnd, moveLongWordNext, moveLongWordPrev, moveLongWordEnd, selectLine, selectFile, gotoFileStart, gotoFileEnd, gotoFileLastLineEnd, gotoLineStart, gotoLineEnd, gotoFirstNonWhitespace } from './motions.js'
import { cursor, endOf, normalizeState, startOf } from './selection.js'
import { deleteSurround, gotoMatchingBracket, replaceSurround, selectSurround, selectTextObject, surroundSelections } from './surround.js'
import type { DelegateCommand, DispatchResult, EditorState } from './types.js'

function withMode(state: EditorState, mode: EditorState['mode']): EditorState {
  return { ...state, mode, pending: undefined, count: undefined }
}

function withCountCleared(state: EditorState): EditorState {
  return state.count === undefined ? state : { ...state, count: undefined }
}

function repeatMotion(state: EditorState, times: number, motion: (s: EditorState) => EditorState): EditorState {
  let next = state
  for (let i = 0; i < times; i++) next = motion(next)
  return next
}

function selectedTexts(state: EditorState): string[] {
  return state.selections.map((sel) => state.text.slice(startOf(sel), endOf(sel)))
}

function yankSelections(state: EditorState): EditorState {
  return { ...withCountCleared(state), yanked: selectedTexts(state), pending: undefined }
}

function pasteSelections(state: EditorState, where: 'after' | 'before'): EditorState {
  const yanked = state.yanked && state.yanked.length > 0 ? state.yanked : ['']
  if (yanked.every((text) => text.length === 0)) return { ...withCountCleared(state), pending: undefined }
  const ordered = state.selections
    .map((sel, index) => ({ sel, index, at: where === 'after' ? endOf(sel) : startOf(sel), text: yanked[index] ?? yanked[state.primary] ?? yanked[0]! }))
    .sort((a, b) => b.at - a.at)
  let text = state.text
  const nextSelections = state.selections.map((selection) => ({ ...selection }))
  for (const item of ordered) {
    text = text.slice(0, item.at) + item.text + text.slice(item.at)
    nextSelections[item.index] = { anchor: item.at, head: item.at + item.text.length }
    for (let i = 0; i < nextSelections.length; i++) {
      if (i === item.index) continue
      if (startOf(nextSelections[i]!) >= item.at) {
        nextSelections[i]!.anchor += item.text.length
        nextSelections[i]!.head += item.text.length
      }
    }
  }
  return normalizeState({ ...withCountCleared(state), text, selections: nextSelections, pending: undefined })
}

function deleteSelections(state: EditorState): EditorState {
  const yanked = selectedTexts(state)
  const primarySelection = state.selections[state.primary] ?? state.selections[0]!
  const primaryStart = startOf(primarySelection)
  const ordered = [...state.selections]
    .map((sel) => ({ start: startOf(sel), end: endOf(sel), primary: sel === primarySelection }))
    .sort((a, b) => b.start - a.start)
  let text = state.text
  const deletedRanges: Array<{ start: number; end: number }> = []
  const cursors: Array<{ offset: number; primary: boolean }> = []
  for (const r of ordered) {
    const end = r.start === r.end ? Math.min(text.length, r.end + 1) : r.end
    text = text.slice(0, r.start) + text.slice(end)
    deletedRanges.push({ start: r.start, end })
    cursors.push({ offset: r.start, primary: r.primary })
  }
  for (const item of cursors) {
    const removedBefore = deletedRanges
      .filter((range) => range.start < item.offset)
      .reduce((sum, range) => sum + range.end - range.start, 0)
    item.offset -= removedBefore
  }
  cursors.reverse()
  const primary = Math.max(0, cursors.findIndex((item) => item.primary))
  return normalizeState({ ...state, text, selections: cursors.map((item) => cursor(item.offset)), primary, pending: undefined, yanked })
}

const delegates: Record<string, DelegateCommand> = {
  u: 'undo',
  U: 'redo',
  '/': 'find.open',
  '?': 'find.prevOpen',
  n: 'find.next',
  N: 'find.prev',
  '*': 'search.selection',
  s: 'search.selectInSelections',
  'space y': 'clipboard.yank',
  'space Y': 'clipboard.yankPrimary',
  'space p': 'clipboard.pasteAfter',
  'space P': 'clipboard.pasteBefore',
  'g d': 'lsp.definition',
  'g r': 'lsp.references',
  'space /': 'search.workspace',
  'space f': 'file.quickOpen',
  'space b': 'buffer.quickOpen',
  'space ?': 'command.palette',
  'space c': 'comment.toggle',
  'space r': 'lsp.rename',
  'space a': 'lsp.codeActions',
  'space h': 'lsp.hover',
  'space s': 'symbol.document',
  'space d': 'diagnostic.picker',
  ': w': 'file.save',
  ': w!': 'file.save',
  ': write': 'file.save',
  ': wa': 'file.saveAll',
  ': wa!': 'file.saveAll',
  ': write-all': 'file.saveAll',
  ': q': 'file.close',
  ': q!': 'file.forceClose',
  ': quit': 'file.close',
  ': qa': 'workbench.quit',
  ': qa!': 'workbench.quit',
  ': quit-all': 'workbench.quit',
  ': wq': 'file.saveAndClose',
  ': wq!': 'file.saveAndForceClose',
  ': write-quit': 'file.saveAndClose',
  ': wqa': 'workbench.saveAllAndQuit',
  ': wqa!': 'workbench.saveAllAndQuit',
  '] d': 'diagnostic.next',
  '[ d': 'diagnostic.prev',
  '] D': 'diagnostic.last',
  '[ D': 'diagnostic.first',
  'z f': 'fold.close',
  'z o': 'fold.open',
  'ctrl-u': 'page.up',
  'ctrl-d': 'page.down',
}

export function dispatch(input: EditorState, key: string): DispatchResult {
  let state = normalizeState(input)

  if (key === 'escape' || key === 'ctrl-[') return { kind: 'state', state: withMode(state, 'normal') }

  if (state.mode === 'insert') return { kind: 'state', state }

  const pending = state.pending ?? []
  const seq = [...pending, key].join(' ')
  const commandState = pending.length > 0 ? { ...state, pending: undefined } : state
  const count = commandState.count ?? 1

  if (pending.length === 0 && /^[0-9]$/.test(key)) {
    if (key === '0' && commandState.count === undefined) return { kind: 'state', state: withCountCleared(commandState) }
    const nextCount = (commandState.count ?? 0) * 10 + Number(key)
    return { kind: 'state', state: { ...commandState, count: nextCount } }
  }

  switch (seq) {
    case 'i':
      return { kind: 'state', state: withMode(commandState, 'insert') }
    case 'a':
      return { kind: 'state', state: withMode(moveRight(commandState), 'insert') }
    case 'v':
      return { kind: 'state', state: withMode(commandState, 'select') }
    case 'h':
    case 'left':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveLeft)) }
    case 'l':
    case 'right':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveRight)) }
    case 'j':
    case 'down':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, (s) => moveVertical(s, 1))) }
    case 'k':
    case 'up':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, (s) => moveVertical(s, -1))) }
    case 'w':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveWordNext)) }
    case 'W':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveLongWordNext)) }
    case 'b':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveWordPrev)) }
    case 'B':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveLongWordPrev)) }
    case 'e':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveWordEnd)) }
    case 'E':
      return { kind: 'state', state: withCountCleared(repeatMotion(commandState, count, moveLongWordEnd)) }
    case 'x':
      return { kind: 'state', state: selectLine(commandState) }
    case '%':
      return { kind: 'state', state: selectFile(commandState) }
    case ',':
    case ';':
      return { kind: 'state', state: { ...withCountCleared(commandState), selections: [commandState.selections[commandState.primary]!], primary: 0 } }
    case 'y':
      return { kind: 'state', state: yankSelections(commandState) }
    case 'p':
      return { kind: 'state', state: pasteSelections(commandState, 'after') }
    case 'P':
      return { kind: 'state', state: pasteSelections(commandState, 'before') }
    case 'd':
      return { kind: 'state', state: withMode(deleteSelections(commandState), 'normal') }
    case 'c':
      return { kind: 'state', state: withMode(deleteSelections(commandState), 'insert') }
    case 'G':
      return { kind: 'state', state: gotoFileEnd(commandState) }
    case 'g g':
      return { kind: 'state', state: gotoFileStart(commandState) }
    case 'g e':
      return { kind: 'state', state: gotoFileLastLineEnd(commandState) }
    case 'g h':
      return { kind: 'state', state: gotoLineStart(commandState) }
    case 'g l':
      return { kind: 'state', state: gotoLineEnd(commandState) }
    case 'g s':
      return { kind: 'state', state: gotoFirstNonWhitespace(commandState) }
    case 'm m':
      return { kind: 'state', state: gotoMatchingBracket(commandState) }
  }

  if (pending.length === 2 && pending[0] === 'm' && pending[1] === 's') {
    return { kind: 'state', state: surroundSelections(commandState, key) }
  }
  if (pending.length === 2 && pending[0] === 'm' && pending[1] === 'i') {
    const state = ['w', 'W', 'p', 'P'].includes(key) ? selectTextObject(commandState, key, false) : selectSurround(commandState, key, false)
    return { kind: 'state', state }
  }
  if (pending.length === 2 && pending[0] === 'm' && pending[1] === 'a') {
    const state = ['w', 'W', 'p', 'P'].includes(key) ? selectTextObject(commandState, key, true) : selectSurround(commandState, key, true)
    return { kind: 'state', state }
  }
  if (pending.length === 2 && pending[0] === 'm' && pending[1] === 'd') {
    return { kind: 'state', state: deleteSurround(commandState, key) }
  }
  if (pending.length === 3 && pending[0] === 'm' && pending[1] === 'r') {
    return { kind: 'state', state: replaceSurround(commandState, pending[2]!, key) }
  }

  if (pending[0] === ':') {
    if (key === 'enter') {
      const delegate = delegates[`: ${pending.slice(1).join('')}`]
      return delegate
        ? { kind: 'delegate', state: withCountCleared(commandState), command: delegate }
        : { kind: 'state', state: { ...withCountCleared(commandState), pending: undefined } }
    }
    if (key === 'escape' || key === 'ctrl-[') return { kind: 'state', state: withMode(commandState, 'normal') }
    return { kind: 'state', state: { ...state, pending: [...pending, key] } }
  }

  const delegate = delegates[seq]
  if (delegate) {
    return { kind: 'delegate', state: withCountCleared(commandState), command: delegate }
  }

  if (['g', 'space', '[', ']', 'z', 'm', ':'].includes(seq)) {
    return { kind: 'state', state: { ...state, pending: [key] } }
  }

  if (seq === 'm s' || seq === 'm i' || seq === 'm a' || seq === 'm d') {
    return { kind: 'state', state: { ...state, pending: ['m', key] } }
  }

  if (seq === 'm r') {
    return { kind: 'state', state: { ...state, pending: ['m', 'r'] } }
  }

  if (pending.length === 2 && pending[0] === 'm' && pending[1] === 'r') {
    return { kind: 'state', state: { ...state, pending: ['m', 'r', key] } }
  }

  return { kind: 'state', state: { ...withCountCleared(state), pending: undefined } }
}

export function dispatchKey(input: EditorState, key: string): EditorState {
  return dispatch(input, key).state
}
