import { describe, expect, test } from 'vitest'
import coreMotions from '../fixtures/core-motions.json' with { type: 'json' }
import wordMotions from '../fixtures/word-motions.json' with { type: 'json' }
import edits from '../fixtures/edits.json' with { type: 'json' }
import edgeCases from '../fixtures/edge-cases.json' with { type: 'json' }
import { replay } from '../src/core/replay.js'
import type { ReplayCase } from '../src/core/types.js'

const cases = [...coreMotions, ...wordMotions, ...edits, ...edgeCases] as ReplayCase[]

describe('replay fixtures', () => {
  for (const c of cases) {
    test(c.name, () => {
      const got = replay(c)
      expect(got.text).toBe(c.want.text)
      expect(got.mode).toBe(c.want.mode)
      expect(got.selections).toEqual(c.want.selections)
      expect(got.primary).toBe(c.want.primary ?? 0)
    })
  }
})
