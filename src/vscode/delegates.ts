import type { DelegateCommand } from '../core/types.js'

export const delegateCommands: Record<DelegateCommand, string> = {
  undo: 'undo',
  redo: 'redo',
  'find.open': 'actions.find',
  'find.next': 'editor.action.nextMatchFindAction',
  'find.prev': 'editor.action.previousMatchFindAction',
  'file.quickOpen': 'workbench.action.quickOpen',
  'buffer.quickOpen': 'workbench.action.showAllEditors',
  'command.palette': 'workbench.action.showCommands',
  'comment.toggle': 'editor.action.commentLine',
  'lsp.definition': 'editor.action.revealDefinition',
  'lsp.references': 'editor.action.referenceSearch.trigger',
  'lsp.rename': 'editor.action.rename',
  'lsp.codeActions': 'editor.action.quickFix',
  'lsp.hover': 'editor.action.showHover',
  'diagnostic.next': 'editor.action.marker.next',
  'diagnostic.prev': 'editor.action.marker.prev',
  'fold.close': 'editor.fold',
  'fold.open': 'editor.unfold',
}
