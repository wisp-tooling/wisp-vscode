import { cursor, endOf, normalizeState, startOf } from './selection.js'
import type { EditorState, Selection } from './types.js'

type Pair = { open: string; close: string }

const pairs: Record<string, Pair> = {
  '(': { open: '(', close: ')' },
  ')': { open: '(', close: ')' },
  '[': { open: '[', close: ']' },
  ']': { open: '[', close: ']' },
  '{': { open: '{', close: '}' },
  '}': { open: '{', close: '}' },
  '<': { open: '<', close: '>' },
  '>': { open: '<', close: '>' },
  '"': { open: '"', close: '"' },
  "'": { open: "'", close: "'" },
  '`': { open: '`', close: '`' },
}

const closingToOpening: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
  '>': '<',
}

const openingToClosing: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
}

export function surroundSelections(state: EditorState, delimiter: string): EditorState {
  const pair = pairs[delimiter]
  if (!pair) return { ...state, pending: undefined }

  const ordered = state.selections
    .map((selection, index) => ({ selection, index, start: startOf(selection), end: endOf(selection) }))
    .sort((a, b) => b.start - a.start)

  let text = state.text
  const nextSelections: Selection[] = state.selections.map((selection) => ({ ...selection }))

  for (const item of ordered) {
    text = text.slice(0, item.end) + pair.close + text.slice(item.end)
    text = text.slice(0, item.start) + pair.open + text.slice(item.start)
    nextSelections[item.index] = { anchor: item.start, head: item.end + pair.open.length + pair.close.length }
  }

  return normalizeState({ ...state, text, selections: nextSelections, pending: undefined })
}

export function gotoMatchingBracket(state: EditorState): EditorState {
  return normalizeState({
    ...state,
    selections: state.selections.map((selection) => {
      const match = findMatchingBracket(state.text, selection.head)
      if (match === undefined) return selection
      return state.mode === 'select' ? { anchor: selection.anchor, head: match } : cursor(match)
    }),
    pending: undefined,
  })
}

function findMatchingBracket(text: string, offset: number): number | undefined {
  const at = text[offset]
  const before = offset > 0 ? text[offset - 1] : undefined
  if (at && openingToClosing[at]) return findForward(text, offset, at, openingToClosing[at]!)
  if (at && closingToOpening[at]) return findBackward(text, offset, closingToOpening[at]!, at)
  if (before && openingToClosing[before]) return findForward(text, offset - 1, before, openingToClosing[before]!)
  if (before && closingToOpening[before]) return findBackward(text, offset - 1, closingToOpening[before]!, before)
  return undefined
}

function findForward(text: string, offset: number, open: string, close: string): number | undefined {
  let depth = 0
  for (let i = offset; i < text.length; i++) {
    if (text[i] === open) depth++
    if (text[i] === close) depth--
    if (depth === 0) return i
  }
  return undefined
}

function findBackward(text: string, offset: number, open: string, close: string): number | undefined {
  let depth = 0
  for (let i = offset; i >= 0; i--) {
    if (text[i] === close) depth++
    if (text[i] === open) depth--
    if (depth === 0) return i
  }
  return undefined
}
