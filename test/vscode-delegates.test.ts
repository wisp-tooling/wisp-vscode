import { describe, expect, test } from 'vitest'
import { delegateCommands } from '../src/vscode/delegates.js'
import type { DelegateCommand } from '../src/core/types.js'

const expected: DelegateCommand[] = [
  'undo',
  'redo',
  'find.open',
  'find.next',
  'find.prev',
  'file.quickOpen',
  'buffer.quickOpen',
  'command.palette',
  'comment.toggle',
  'lsp.definition',
  'lsp.references',
  'lsp.rename',
  'lsp.codeActions',
  'lsp.hover',
  'diagnostic.next',
  'diagnostic.prev',
  'diagnostic.first',
  'diagnostic.last',
  'fold.close',
  'fold.open',
]

describe('vscode delegate command map', () => {
  test('maps every delegate command', () => {
    expect(Object.keys(delegateCommands).sort()).toEqual([...expected].sort())
  })

  test('all mapped command ids are non-empty', () => {
    for (const id of Object.values(delegateCommands)) {
      expect(id.length).toBeGreaterThan(0)
    }
  })
})
