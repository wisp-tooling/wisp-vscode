export type Mode = 'normal' | 'insert' | 'select'

export type Selection = {
  anchor: number
  head: number
}

export type EditorState = {
  text: string
  selections: Selection[]
  primary: number
  mode: Mode
  pending?: string[] | undefined
  count?: number | undefined
  preferredColumns?: Array<number | null> | undefined
  yanked?: string[] | undefined
}

export type DelegateCommand =
  | 'undo'
  | 'redo'
  | 'find.open'
  | 'find.prevOpen'
  | 'find.next'
  | 'find.prev'
  | 'search.selection'
  | 'search.selectInSelections'
  | 'search.workspace'
  | 'clipboard.yank'
  | 'clipboard.pasteAfter'
  | 'clipboard.pasteBefore'
  | 'file.quickOpen'
  | 'buffer.quickOpen'
  | 'command.palette'
  | 'comment.toggle'
  | 'lsp.definition'
  | 'lsp.references'
  | 'lsp.rename'
  | 'lsp.codeActions'
  | 'lsp.hover'
  | 'symbol.document'
  | 'diagnostic.picker'
  | 'file.save'
  | 'file.saveAll'
  | 'file.close'
  | 'file.forceClose'
  | 'file.saveAndClose'
  | 'file.saveAndForceClose'
  | 'workbench.quit'
  | 'workbench.saveAllAndQuit'
  | 'diagnostic.next'
  | 'diagnostic.prev'
  | 'diagnostic.first'
  | 'diagnostic.last'
  | 'fold.close'
  | 'fold.open'
  | 'page.up'
  | 'page.down'

export type DispatchResult =
  | { kind: 'state'; state: EditorState }
  | { kind: 'delegate'; state: EditorState; command: DelegateCommand }

export type ReplayCase = {
  name: string
  text: string
  mode: Mode
  selections: Selection[]
  primary?: number
  keys: string[]
  want: {
    text: string
    mode: Mode
    selections: Selection[]
    primary?: number
    yanked?: string[]
  }
}

export function cloneState(state: EditorState): EditorState {
  return {
    text: state.text,
    selections: state.selections.map((s) => ({ ...s })),
    primary: state.primary,
    mode: state.mode,
    pending: state.pending ? [...state.pending] : undefined,
    count: state.count,
    preferredColumns: state.preferredColumns ? [...state.preferredColumns] : undefined,
    yanked: state.yanked ? [...state.yanked] : undefined,
  }
}
