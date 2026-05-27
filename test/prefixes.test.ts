import { describe, expect, test } from 'vitest'
import { prefixHints } from '../src/core/prefixes.js'

describe('prefix hints', () => {
  test('g prefix exposes goto commands', () => {
    expect(prefixHints(['g']).map((hint) => hint.key)).toContain('g')
    expect(prefixHints(['g']).map((hint) => hint.key)).toContain('r')
  })

  test('space prefix exposes command palette', () => {
    expect(prefixHints(['space']).some((hint) => hint.key === '?' && hint.label === 'command palette')).toBe(true)
  })

  test('match prefix exposes nested surround hints', () => {
    expect(prefixHints(['m']).map((hint) => hint.key)).toContain('s')
    expect(prefixHints(['m', 's']).map((hint) => hint.key)).toContain('(')
  })

  test('unknown prefix has no hints', () => {
    expect(prefixHints(['unknown'])).toEqual([])
  })
})
