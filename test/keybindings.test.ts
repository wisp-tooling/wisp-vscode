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
})
