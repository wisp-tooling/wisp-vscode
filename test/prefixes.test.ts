import { describe, expect, test } from 'vitest'
import { prefixHints } from '../src/core/prefixes.js'

describe('prefix hints', () => {
  test('g prefix exposes ordered goto commands', () => {
    expect(prefixHints(['g']).map((hint) => hint.key)).toEqual(['g', 'e', 'h', 'l', 's', 'd', 'r'])
  })

  test('space prefix exposes command palette', () => {
    expect(prefixHints(['space']).some((hint) => hint.key === '?' && hint.label === 'command palette')).toBe(true)
  })

  test('match prefix exposes nested surround hints', () => {
    expect(prefixHints(['m']).map((hint) => hint.key)).toContain('s')
    expect(prefixHints(['m', 's']).map((hint) => hint.key)).toContain('(')
  })

  test('replace surround exposes target delimiter hints after source delimiter', () => {
    expect(prefixHints(['m', 'r', '(']).map((hint) => hint.key)).toContain('[')
  })

  test('unknown prefix has no hints', () => {
    expect(prefixHints(['unknown'])).toEqual([])
  })
})
