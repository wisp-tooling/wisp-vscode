import { dispatchKey } from './commands.js'
import { normalizeState } from './selection.js'
import type { EditorState, ReplayCase } from './types.js'

export function replay(testCase: ReplayCase): EditorState {
  let state: EditorState = normalizeState({
    text: testCase.text,
    mode: testCase.mode,
    selections: testCase.selections,
    primary: testCase.primary ?? 0,
  })
  for (const key of testCase.keys) {
    state = dispatchKey(state, key)
  }
  return state
}
