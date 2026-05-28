export type PrefixHint = {
  key: string
  label: string
}

const hints: Record<string, PrefixHint[]> = {
  g: [
    { key: 'g', label: 'go to file start' },
    { key: 'e', label: 'go to file end' },
    { key: 'h', label: 'go to line start' },
    { key: 'l', label: 'go to line end' },
    { key: 's', label: 'go to first non-whitespace' },
    { key: 'd', label: 'go to definition' },
    { key: 'r', label: 'go to references' },
    { key: 'w', label: 'visible word jump' },
  ],
  space: [
    { key: '/', label: 'workspace search' },
    { key: 'f', label: 'quick open' },
    { key: 'b', label: 'buffers' },
    { key: '?', label: 'command palette' },
    { key: 'c', label: 'toggle comment' },
    { key: 'r', label: 'rename' },
    { key: 'a', label: 'code actions' },
    { key: 'h', label: 'hover' },
    { key: 's', label: 'document symbols' },
    { key: 'd', label: 'diagnostics' },
    { key: 'y', label: 'yank to system clipboard' },
    { key: 'p', label: 'paste system clipboard after' },
    { key: 'P', label: 'paste system clipboard before' },
  ],
  ':': [
    { key: 'w', label: 'write / save file' },
    { key: 'w!', label: 'force write / save file' },
    { key: 'wa', label: 'write-all / save all files' },
    { key: 'wa!', label: 'force write-all / save all files' },
    { key: 'q', label: 'quit / close editor' },
    { key: 'q!', label: 'force quit / close editor' },
    { key: 'qa', label: 'quit-all / quit VS Code' },
    { key: 'qa!', label: 'force quit-all / quit VS Code' },
    { key: 'wq', label: 'write-quit / save and close editor' },
    { key: 'wq!', label: 'force write-quit / save and close editor' },
    { key: 'wqa', label: 'write-quit-all / save all and quit' },
    { key: 'wqa!', label: 'write-quit-all force' },
  ],
  '[': [
    { key: 'd', label: 'previous diagnostic' },
    { key: 'D', label: 'first diagnostic' },
  ],
  ']': [
    { key: 'd', label: 'next diagnostic' },
    { key: 'D', label: 'last diagnostic' },
  ],
  z: [
    { key: 'f', label: 'fold close' },
    { key: 'o', label: 'fold open' },
  ],
  m: [
    { key: 'm', label: 'match bracket' },
    { key: 's', label: 'surround add' },
    { key: 'i', label: 'select inside' },
    { key: 'a', label: 'select around' },
    { key: 'd', label: 'surround delete' },
    { key: 'r', label: 'surround replace' },
  ],
  'm s': [
    { key: '(', label: 'parentheses' },
    { key: '[', label: 'brackets' },
    { key: '{', label: 'braces' },
    { key: '<', label: 'angles' },
    { key: "'", label: 'single quotes' },
    { key: '"', label: 'double quotes' },
    { key: '`', label: 'backticks' },
  ],
  'm i': [
    { key: 'w', label: 'word' },
    { key: 'W', label: 'WORD' },
    { key: 'p', label: 'paragraph' },
    { key: '(', label: 'inside parentheses' },
    { key: '[', label: 'inside brackets' },
    { key: '{', label: 'inside braces' },
    { key: "'", label: 'inside quotes' },
  ],
  'm a': [
    { key: 'w', label: 'word' },
    { key: 'W', label: 'WORD' },
    { key: 'p', label: 'paragraph' },
    { key: '(', label: 'around parentheses' },
    { key: '[', label: 'around brackets' },
    { key: '{', label: 'around braces' },
    { key: "'", label: 'around quotes' },
  ],
  'm d': [
    { key: '(', label: 'delete parentheses' },
    { key: '[', label: 'delete brackets' },
    { key: '{', label: 'delete braces' },
    { key: "'", label: 'delete quotes' },
  ],
  'm r': [
    { key: '(', label: 'replace from parentheses' },
    { key: '[', label: 'replace from brackets' },
    { key: '{', label: 'replace from braces' },
    { key: '<', label: 'replace from angles' },
    { key: "'", label: 'replace from single quotes' },
    { key: '"', label: 'replace from double quotes' },
    { key: '`', label: 'replace from backticks' },
  ],
}

const replacementTargets: PrefixHint[] = [
  { key: '(', label: 'replace to parentheses' },
  { key: '[', label: 'replace to brackets' },
  { key: '{', label: 'replace to braces' },
  { key: '<', label: 'replace to angles' },
  { key: "'", label: 'replace to single quotes' },
  { key: '"', label: 'replace to double quotes' },
  { key: '`', label: 'replace to backticks' },
]

export function prefixHints(pending: string[] | undefined): PrefixHint[] {
  if (!pending) return []
  if (pending.length === 3 && pending[0] === 'm' && pending[1] === 'r') return replacementTargets
  return hints[pending.join(' ')] ?? []
}
