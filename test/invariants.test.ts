import { describe, expect, test } from 'vitest'
import coreMotions from '../fixtures/core-motions.json' with { type: 'json' }
import wordMotions from '../fixtures/word-motions.json' with { type: 'json' }
import edits from '../fixtures/edits.json' with { type: 'json' }
import edgeCases from '../fixtures/edge-cases.json' with { type: 'json' }
import { dispatchKey } from '../src/core/commands.js'
import { endOf, normalizeState, startOf } from '../src/core/selection.js'
import type { EditorState, ReplayCase } from '../src/core/types.js'

const cases = [...coreMotions, ...wordMotions, ...edits, ...edgeCases] as ReplayCase[]

function expectInvariants(state: EditorState): void {
  expect(state.selections.length).toBeGreaterThan(0)
  expect(state.primary).toBeGreaterThanOrEqual(0)
  expect(state.primary).toBeLessThan(state.selections.length)

  let previousEnd = -1
  for (const sel of state.selections) {
    expect(sel.anchor).toBeGreaterThanOrEqual(0)
    expect(sel.anchor).toBeLessThanOrEqual(state.text.length)
    expect(sel.head).toBeGreaterThanOrEqual(0)
    expect(sel.head).toBeLessThanOrEqual(state.text.length)
    expect(startOf(sel)).toBeGreaterThanOrEqual(previousEnd)
    previousEnd = endOf(sel)
  }
}

describe('core invariants', () => {
  for (const c of cases) {
    test(c.name, () => {
      let state: EditorState = normalizeState({
        text: c.text,
        mode: c.mode,
        selections: c.selections,
        primary: c.primary ?? 0,
      })
      expectInvariants(state)

      for (const key of c.keys) {
        state = dispatchKey(state, key)
        expectInvariants(state)
      }
    })
  }

  test('completed prefix command clears pending state', () => {
    let state: EditorState = normalizeState({
      text: 'abc\ndef\n',
      mode: 'normal',
      selections: [{ anchor: 5, head: 5 }],
      primary: 0,
    })

    state = dispatchKey(state, 'g')
    expect(state.pending).toEqual(['g'])

    state = dispatchKey(state, 'g')
    expect(state.pending).toBeUndefined()

    state = dispatchKey(state, 'l')
    expect(state.selections).toEqual([{ anchor: 1, head: 1 }])
  })
})
