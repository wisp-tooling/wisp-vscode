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
  const inputPrimary = clamp(state.primary, 0, selections.length - 1)
  const normalized = selections
    .map((selection, index) => ({ selection: normalizeSelection(selection, state.text.length), primary: index === inputPrimary }))
    .sort((a, b) => startOf(a.selection) - startOf(b.selection) || endOf(a.selection) - endOf(b.selection))

  const merged: Array<{ selection: Selection; primary: boolean }> = []
  for (const item of normalized) {
    const previous = merged[merged.length - 1]
    if (!previous || startOf(item.selection) >= endOf(previous.selection)) {
      merged.push({ selection: item.selection, primary: item.primary })
      continue
    }
    previous.primary ||= item.primary
    previous.selection.anchor = startOf(previous.selection)
    previous.selection.head = Math.max(endOf(previous.selection), endOf(item.selection))
  }

  const primary = Math.max(0, merged.findIndex((item) => item.primary))
  return { ...state, selections: merged.map((item) => item.selection), primary }
}

export function replaceSelections(state: EditorState, f: (sel: Selection, index: number) => Selection): EditorState {
  const next = {
    ...state,
    selections: state.selections.map((sel, i) => f(sel, i)),
    preferredColumns: undefined,
  }
  return normalizeState(next)
}
