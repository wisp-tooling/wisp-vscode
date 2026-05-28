import { lastLineStart, lineColToOffset, lineRangeAt, offsetToLineCol } from './buffer.js'
import { cursor, endOf, replaceSelections, startOf } from './selection.js'
import type { EditorState, Selection } from './types.js'

function isWord(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch)
}

function isLongWord(ch: string | undefined): boolean {
  return ch !== undefined && !/\s/.test(ch)
}

function wordAt(text: string, pos: number): Selection {
  if (text.length === 0) return cursor(0)
  let i = Math.max(0, Math.min(pos, text.length - 1))
  while (i < text.length && !isWord(text[i])) i++
  if (i >= text.length) return cursor(text.length)
  let start = i
  while (start > 0 && isWord(text[start - 1])) start--
  let end = i
  while (end < text.length && isWord(text[end])) end++
  return { anchor: start, head: end }
}

export function moveLeft(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const pos = Math.max(0, sel.head - 1)
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : cursor(pos)
  })
}

export function moveRight(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const pos = Math.min(state.text.length, sel.head + 1)
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : cursor(pos)
  })
}

export function moveVertical(state: EditorState, delta: -1 | 1): EditorState {
  const preferred = state.preferredColumns ? [...state.preferredColumns] : []
  const selections = state.selections.map((sel, i) => {
    const lc = offsetToLineCol(state.text, sel.head)
    const col = preferred[i] ?? lc.col
    preferred[i] = col
    const target = lineColToOffset(state.text, { line: lc.line + delta, col })
    return state.mode === 'select' ? { anchor: sel.anchor, head: target } : cursor(target)
  })
  return { ...state, selections, preferredColumns: preferred }
}

export function moveWordNext(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const from = state.mode === 'select' ? sel.head : endOf(sel)
    let pos = from
    let anchor = from
    if (state.text[pos] === '\n') {
      pos++
      while (pos < state.text.length && state.text[pos] !== '\n' && !isWord(state.text[pos])) pos++
      anchor = pos
    }
    while (pos < state.text.length && isWord(state.text[pos])) pos++
    while (pos < state.text.length && state.text[pos] !== '\n' && !isWord(state.text[pos])) pos++
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : { anchor, head: pos }
  })
}

export function moveWordPrev(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const from = state.mode === 'select' ? sel.head : startOf(sel)
    let pos = from - 1
    let anchor = from
    if (state.text[pos] === '\n') {
      pos--
      while (pos > 0 && state.text[pos] !== '\n' && !isWord(state.text[pos])) pos--
      anchor = pos + 1
    } else {
      while (pos > 0 && !isWord(state.text[pos])) pos--
    }
    while (pos > 0 && isWord(state.text[pos - 1])) pos--
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : { anchor, head: pos }
  })
}

export function moveWordEnd(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const from = state.mode === 'select' ? sel.head : endOf(sel)
    let pos = from
    let anchor = from
    if (state.text[pos] === '\n') {
      pos++
      while (pos < state.text.length && state.text[pos] !== '\n' && !isWord(state.text[pos])) pos++
      anchor = pos
    } else {
      while (pos < state.text.length && !isWord(state.text[pos])) pos++
    }
    while (pos < state.text.length && isWord(state.text[pos])) pos++
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : { anchor, head: pos }
  })
}

export function moveLongWordNext(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const from = state.mode === 'select' ? sel.head : endOf(sel)
    let pos = from
    let anchor = from
    if (state.text[pos] === '\n') {
      pos++
      while (pos < state.text.length && state.text[pos] !== '\n' && !isLongWord(state.text[pos])) pos++
      anchor = pos
    }
    while (pos < state.text.length && isLongWord(state.text[pos])) pos++
    while (pos < state.text.length && state.text[pos] !== '\n' && !isLongWord(state.text[pos])) pos++
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : { anchor, head: pos }
  })
}

export function moveLongWordPrev(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const from = state.mode === 'select' ? sel.head : startOf(sel)
    let pos = from - 1
    let anchor = from
    if (state.text[pos] === '\n') {
      pos--
      while (pos > 0 && state.text[pos] !== '\n' && !isLongWord(state.text[pos])) pos--
      anchor = pos + 1
    } else {
      while (pos > 0 && !isLongWord(state.text[pos])) pos--
    }
    while (pos > 0 && isLongWord(state.text[pos - 1])) pos--
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : { anchor, head: pos }
  })
}

export function moveLongWordEnd(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const from = state.mode === 'select' ? sel.head : endOf(sel)
    let pos = from
    let anchor = from
    if (state.text[pos] === '\n') {
      pos++
      while (pos < state.text.length && state.text[pos] !== '\n' && !isLongWord(state.text[pos])) pos++
      anchor = pos
    } else {
      while (pos < state.text.length && !isLongWord(state.text[pos])) pos++
    }
    while (pos < state.text.length && isLongWord(state.text[pos])) pos++
    return state.mode === 'select' ? { anchor: sel.anchor, head: pos } : { anchor, head: pos }
  })
}

export function selectLine(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const start = startOf(sel)
    const end = endOf(sel)
    const selectedEndLine = lineRangeAt(state.text, Math.max(start, end - 1))
    if (start === lineRangeAt(state.text, start).start && end === selectedEndLine.end && end < state.text.length) {
      return { anchor: start, head: lineRangeAt(state.text, end).end }
    }

    const current = lineRangeAt(state.text, sel.head)
    return { anchor: current.start, head: current.end }
  })
}

export function selectFile(state: EditorState): EditorState {
  return { ...state, selections: [{ anchor: 0, head: state.text.length }], primary: 0, preferredColumns: undefined }
}

function gotoTarget(state: EditorState, sel: Selection, target: number): Selection {
  return state.mode === 'select' ? { anchor: sel.anchor, head: target } : cursor(target)
}

export function gotoFileStart(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => gotoTarget(state, sel, 0))
}

export function gotoFileEnd(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => gotoTarget(state, sel, lastLineStart(state.text)))
}

export function gotoFileLastLineEnd(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => gotoTarget(state, sel, state.text.length))
}

export function gotoLineStart(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => gotoTarget(state, sel, lineRangeAt(state.text, sel.head).start))
}

export function gotoLineEnd(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => gotoTarget(state, sel, lineRangeAt(state.text, sel.head).endNoNewline))
}

export function gotoFirstNonWhitespace(state: EditorState): EditorState {
  return replaceSelections(state, (sel) => {
    const r = lineRangeAt(state.text, sel.head)
    let pos = r.start
    while (pos < r.endNoNewline && /\s/.test(state.text[pos]!)) pos++
    return gotoTarget(state, sel, pos)
  })
}
