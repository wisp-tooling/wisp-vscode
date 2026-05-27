import { moveLeft, moveRight, moveVertical, moveWordNext, moveWordPrev, moveWordEnd, moveLongWordNext, moveLongWordPrev, moveLongWordEnd, selectLine, selectFile, gotoFileStart, gotoFileEnd, gotoFileLastLineEnd, gotoLineStart, gotoLineEnd, gotoFirstNonWhitespace } from './motions.js'
import { cursor, endOf, normalizeState, startOf } from './selection.js'
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

function deleteSelections(state: EditorState): EditorState {
  const ordered = [...state.selections]
    .map((sel) => ({ start: startOf(sel), end: endOf(sel) }))
    .sort((a, b) => b.start - a.start)
  let text = state.text
  const cursors: number[] = []
  for (const r of ordered) {
    const end = r.start === r.end ? Math.min(text.length, r.end + 1) : r.end
    text = text.slice(0, r.start) + text.slice(end)
    cursors.push(r.start)
  }
  cursors.reverse()
  return normalizeState({ ...state, text, selections: cursors.map(cursor), primary: 0, pending: undefined })
}

const delegates: Record<string, DelegateCommand> = {
  u: 'undo',
  U: 'redo',
  '/': 'find.open',
  n: 'find.next',
  N: 'find.prev',
  'g d': 'lsp.definition',
  'g r': 'lsp.references',
  'space f': 'file.quickOpen',
  'space b': 'buffer.quickOpen',
  'space ?': 'command.palette',
  'space c': 'comment.toggle',
  'space r': 'lsp.rename',
  'space a': 'lsp.codeActions',
  'space h': 'lsp.hover',
  '] d': 'diagnostic.next',
  '[ d': 'diagnostic.prev',
  '] D': 'diagnostic.last',
  '[ D': 'diagnostic.first',
  'z f': 'fold.close',
  'z o': 'fold.open',
}

export function dispatch(input: EditorState, key: string): DispatchResult {
  let state = normalizeState(input)

  if (key === 'escape') return { kind: 'state', state: withMode(state, 'normal') }

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
  }

  const delegate = delegates[seq]
  if (delegate) {
    return { kind: 'delegate', state: withCountCleared(commandState), command: delegate }
  }

  if (['g', 'space', '[', ']', 'z', 'm'].includes(seq)) {
    return { kind: 'state', state: { ...state, pending: [key] } }
  }

  return { kind: 'state', state: { ...withCountCleared(state), pending: undefined } }
}

export function dispatchKey(input: EditorState, key: string): EditorState {
  return dispatch(input, key).state
}
