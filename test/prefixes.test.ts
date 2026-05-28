import { describe, expect, test } from 'vitest'
import { prefixHints } from '../src/core/prefixes.js'

describe('prefix hints', () => {
  test('g prefix exposes ordered goto commands', () => {
    expect(prefixHints(['g']).map((hint) => hint.key)).toEqual(['g', 'e', 'h', 'l', 's', 'd', 'r', 'w'])
  })

  test('space prefix exposes picker commands', () => {
    const keys = prefixHints(['space']).map((hint) => hint.key)
    expect(keys).toContain('?')
    expect(keys).toContain('/')
    expect(keys).toContain('d')
    expect(keys).toContain('s')
  })

  test('colon prefix exposes Helix command-mode file commands', () => {
    const keys = prefixHints([':']).map((hint) => hint.key)
    expect(keys).toEqual(expect.arrayContaining(['w', 'W', 'q', 'wq', 'q!']))
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
