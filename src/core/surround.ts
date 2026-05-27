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
    for (let i = 0; i < nextSelections.length; i++) {
      if (i === item.index) continue
      if (startOf(nextSelections[i]!) > item.start) {
        nextSelections[i]!.anchor += pair.open.length + pair.close.length
        nextSelections[i]!.head += pair.open.length + pair.close.length
      }
    }
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

export function selectSurround(state: EditorState, delimiter: string, includeDelimiters: boolean): EditorState {
  const pair = pairs[delimiter]
  if (!pair) return { ...state, pending: undefined }
  return normalizeState({
    ...state,
    selections: state.selections.map((selection) => {
      const found = findEnclosingPair(state.text, selection.head, pair)
      if (!found) return selection
      return includeDelimiters
        ? { anchor: found.open, head: found.close + pair.close.length }
        : { anchor: found.open + pair.open.length, head: found.close }
    }),
    pending: undefined,
  })
}

export function deleteSurround(state: EditorState, delimiter: string): EditorState {
  const pair = pairs[delimiter]
  if (!pair) return { ...state, pending: undefined }
  const found = findEnclosingPair(state.text, state.selections[state.primary]?.head ?? 0, pair)
  if (!found) return { ...state, pending: undefined }
  const text = state.text.slice(0, found.close) + state.text.slice(found.close + pair.close.length)
  const nextText = text.slice(0, found.open) + text.slice(found.open + pair.open.length)
  return normalizeState({ ...state, text: nextText, selections: [cursor(found.open)], primary: 0, pending: undefined })
}

export function replaceSurround(state: EditorState, fromDelimiter: string, toDelimiter: string): EditorState {
  const from = pairs[fromDelimiter]
  const to = pairs[toDelimiter]
  if (!from || !to) return { ...state, pending: undefined }
  const found = findEnclosingPair(state.text, state.selections[state.primary]?.head ?? 0, from)
  if (!found) return { ...state, pending: undefined }
  let text = state.text.slice(0, found.close) + to.close + state.text.slice(found.close + from.close.length)
  text = text.slice(0, found.open) + to.open + text.slice(found.open + from.open.length)
  return normalizeState({ ...state, text, selections: [cursor(found.open)], primary: 0, pending: undefined })
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

function findEnclosingPair(text: string, offset: number, pair: Pair): { open: number; close: number } | undefined {
  if (pair.open === pair.close) {
    const open = text.lastIndexOf(pair.open, Math.max(0, offset - 1))
    if (open < 0) return undefined
    const close = text.indexOf(pair.close, offset)
    return close < 0 ? undefined : { open, close }
  }
  for (let i = Math.min(offset, text.length - 1); i >= 0; i--) {
    if (text[i] !== pair.open) continue
    const close = findForward(text, i, pair.open, pair.close)
    if (close !== undefined && close >= offset) return { open: i, close }
  }
  return undefined
}
