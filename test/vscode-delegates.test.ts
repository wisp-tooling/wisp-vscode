import { describe, expect, test } from 'vitest'
import { delegateCommands } from '../src/vscode/delegates.js'
import type { DelegateCommand } from '../src/core/types.js'

const expected: DelegateCommand[] = [
  'undo',
  'redo',
  'find.open',
  'find.prevOpen',
  'find.next',
  'find.prev',
  'search.selection',
  'search.selectInSelections',
  'search.workspace',
  'clipboard.yank',
  'clipboard.pasteAfter',
  'clipboard.pasteBefore',
  'file.quickOpen',
  'buffer.quickOpen',
  'command.palette',
  'comment.toggle',
  'lsp.definition',
  'lsp.references',
  'lsp.rename',
  'lsp.codeActions',
  'lsp.hover',
  'symbol.document',
  'diagnostic.picker',
  'file.save',
  'file.saveAll',
  'file.close',
  'file.forceClose',
  'file.saveAndClose',
  'file.saveAndForceClose',
  'workbench.quit',
  'workbench.saveAllAndQuit',
  'diagnostic.next',
  'diagnostic.prev',
  'diagnostic.first',
  'diagnostic.last',
  'fold.close',
  'fold.open',
  'page.up',
  'page.down',
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
