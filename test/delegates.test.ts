import { describe, expect, test } from 'vitest'
import { dispatch } from '../src/core/commands.js'
import type { DelegateCommand, EditorState } from '../src/core/types.js'

function state(pending?: string[]): EditorState {
  return {
    text: 'abc\n',
    mode: 'normal',
    selections: [{ anchor: 0, head: 0 }],
    primary: 0,
    pending,
  }
}

const cases: Array<{ keys: string[]; command: DelegateCommand }> = [
  { keys: ['u'], command: 'undo' },
  { keys: ['U'], command: 'redo' },
  { keys: ['/'], command: 'find.open' },
  { keys: ['?'], command: 'find.prevOpen' },
  { keys: ['*'], command: 'search.selection' },
  { keys: ['s'], command: 'search.selectInSelections' },
  { keys: ['n'], command: 'find.next' },
  { keys: ['N'], command: 'find.prev' },
  { keys: ['g', 'd'], command: 'lsp.definition' },
  { keys: ['g', 'r'], command: 'lsp.references' },
  { keys: ['space', '/'], command: 'search.workspace' },
  { keys: ['space', 'f'], command: 'file.quickOpen' },
  { keys: ['space', 'b'], command: 'buffer.quickOpen' },
  { keys: ['space', '?'], command: 'command.palette' },
  { keys: ['space', 'c'], command: 'comment.toggle' },
  { keys: ['space', 'r'], command: 'lsp.rename' },
  { keys: ['space', 'a'], command: 'lsp.codeActions' },
  { keys: ['space', 'h'], command: 'lsp.hover' },
  { keys: ['space', 's'], command: 'symbol.document' },
  { keys: ['space', 'd'], command: 'diagnostic.picker' },
  { keys: [':', 'w', 'enter'], command: 'file.save' },
  { keys: [':', 'w', 'a', 'enter'], command: 'file.saveAll' },
  { keys: [':', 'q', 'enter'], command: 'file.close' },
  { keys: [':', 'q', 'a', 'enter'], command: 'workbench.quit' },
  { keys: [':', 'w', 'q', 'enter'], command: 'file.saveAndClose' },
  { keys: [':', 'w', 'q', 'a', 'enter'], command: 'workbench.saveAllAndQuit' },
  { keys: [':', 'w', 'q', 'a', '!', 'enter'], command: 'workbench.saveAllAndQuit' },
  { keys: [']', 'd'], command: 'diagnostic.next' },
  { keys: ['[', 'd'], command: 'diagnostic.prev' },
  { keys: [']', 'D'], command: 'diagnostic.last' },
  { keys: ['[', 'D'], command: 'diagnostic.first' },
  { keys: ['z', 'f'], command: 'fold.close' },
  { keys: ['z', 'o'], command: 'fold.open' },
  { keys: ['ctrl-u'], command: 'page.up' },
  { keys: ['ctrl-d'], command: 'page.down' },
]

describe('delegate dispatch', () => {
  for (const c of cases) {
    test(`${c.keys.join(' ')} delegates to ${c.command}`, () => {
      let current = state()
      let result = dispatch(current, c.keys[0]!)
      for (let i = 1; i < c.keys.length; i++) {
        current = result.state
        result = dispatch(current, c.keys[i]!)
      }

      expect(result.kind).toBe('delegate')
      if (result.kind === 'delegate') {
        expect(result.command).toBe(c.command)
        expect(result.state.pending).toBeUndefined()
      }
    })
  }

  test('insert mode does not delegate printable keys', () => {
    const result = dispatch({ ...state(), mode: 'insert' }, 'u')
    expect(result.kind).toBe('state')
  })
})
