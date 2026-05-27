import { clamp } from './buffer.js'
import type { EditorState, Selection } from './types.js'

export function startOf(sel: Selection): number {
  return Math.min(sel.anchor, sel.head)
}

export function endOf(sel: Selection): number {
  return Math.max(sel.anchor, sel.head)
}

export function cursor(offset: number): Selection {
  return { anchor: offset, head: offset }
}

export function normalizeSelection(sel: Selection, textLength: number): Selection {
  return {
    anchor: clamp(sel.anchor, 0, textLength),
    head: clamp(sel.head, 0, textLength),
  }
}

export function normalizeState(state: EditorState): EditorState {
  const selections = state.selections.length > 0 ? state.selections : [cursor(0)]
  const normalized = selections
    .map((s) => normalizeSelection(s, state.text.length))
    .sort((a, b) => startOf(a) - startOf(b) || endOf(a) - endOf(b))

  const merged: Selection[] = []
  for (const sel of normalized) {
    const previous = merged[merged.length - 1]
    if (!previous || startOf(sel) >= endOf(previous)) {
      merged.push(sel)
      continue
    }
    previous.anchor = startOf(previous)
    previous.head = Math.max(endOf(previous), endOf(sel))
  }

  const primary = clamp(state.primary, 0, merged.length - 1)
  return { ...state, selections: merged, primary }
}

export function replaceSelections(state: EditorState, f: (sel: Selection, index: number) => Selection): EditorState {
  const next = {
    ...state,
    selections: state.selections.map((sel, i) => f(sel, i)),
    preferredColumns: undefined,
  }
  return normalizeState(next)
}
