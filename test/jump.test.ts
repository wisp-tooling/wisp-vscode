import { describe, expect, test } from 'vitest'
import { collectJumpTargetsFromLines, isJumpWordChar, jumpLabelNames } from '../src/core/jump.js'

describe('jump helpers', () => {
  test('labels are deterministic cartesian pairs', () => {
    expect(jumpLabelNames().slice(0, 5)).toEqual(['aa', 'as', 'ad', 'af', 'ag'])
    expect(new Set(jumpLabelNames()).size).toBe(676)
  })

  test('word chars follow MVP word rule', () => {
    expect(isJumpWordChar('a')).toBe(true)
    expect(isJumpWordChar('1')).toBe(true)
    expect(isJumpWordChar('_')).toBe(true)
    expect(isJumpWordChar('-')).toBe(false)
    expect(isJumpWordChar(' ')).toBe(false)
  })

  test('collects word starts in line order', () => {
    const got = collectJumpTargetsFromLines([
      { line: 0, text: 'one two' },
      { line: 1, text: 'three_four' },
    ])
    expect(got.map((target) => target.label)).toEqual(['aa', 'as', 'ad'])
    expect(got.map((target) => target.word)).toEqual(['one', 'two', 'three_four'])
  })

  test('punctuation separates word starts', () => {
    const got = collectJumpTargetsFromLines([{ line: 0, text: 'test-string other' }])
    expect(got.map((target) => target.word)).toEqual(['test', 'string', 'other'])
  })

  test('visible range starting mid-word does not label middle of word', () => {
    const got = collectJumpTargetsFromLines([{ line: 0, text: 'hello world', from: 2, to: 11 }])
    expect(got.map((target) => target.word)).toEqual(['world'])
  })
})
