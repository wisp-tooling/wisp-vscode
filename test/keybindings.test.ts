import { describe, expect, test } from 'vitest'
import pkg from '../package.json' with { type: 'json' }

type Keybinding = { key: string; args?: string }

const keybindings = (pkg.contributes?.keybindings ?? []) as Keybinding[]

function has(key: string, args: string): boolean {
  return keybindings.some((k) => k.key === key && k.args === args)
}

describe('extension keybindings', () => {
  test('captures g r sequence input', () => {
    expect(has('g', 'g')).toBe(true)
    expect(has('r', 'r')).toBe(true)
  })

  test('captures long word motion keys', () => {
    expect(has('shift+w', 'W')).toBe(true)
    expect(has('shift+b', 'B')).toBe(true)
    expect(has('shift+e', 'E')).toBe(true)
  })

  test('captures page movement keys', () => {
    expect(has('ctrl+u', 'ctrl-u')).toBe(true)
    expect(has('ctrl+d', 'ctrl-d')).toBe(true)
  })

  test('captures search keys', () => {
    expect(has('/', '/')).toBe(true)
    expect(has('shift+/', '?')).toBe(true)
    expect(has('shift+8', '*')).toBe(true)
    expect(has('s', 's')).toBe(true)
    expect(has('n', 'n')).toBe(true)
    expect(has('shift+n', 'N')).toBe(true)
  })

  test('captures escape parity, command prefix, and selection collapse keys', () => {
    expect(has('ctrl+[', 'ctrl-[')).toBe(true)
    expect(has(';', ';')).toBe(true)
    expect(has('shift+;', ':')).toBe(true)
    expect(has('q', 'q')).toBe(true)
    expect(has('shift+q', 'Q')).toBe(true)
    expect(has('shift+w', 'W')).toBe(true)
    expect(has(', ', ',')).toBe(true)
  })

  test('captures every jump label alphabet key', () => {
    for (const key of 'asdfghjklqwertyuiopzxcvbnm') {
      expect(has(key, key)).toBe(true)
    }
  })
})
