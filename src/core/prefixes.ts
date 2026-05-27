export type PrefixHint = {
  key: string
  label: string
}

const hints: Record<string, PrefixHint[]> = {
  g: [
    { key: 'g', label: 'file start' },
    { key: 'e', label: 'file end' },
    { key: 'h', label: 'line start' },
    { key: 'l', label: 'line end' },
    { key: 's', label: 'first non-whitespace' },
    { key: 'd', label: 'definition' },
    { key: 'r', label: 'references' },
  ],
  space: [
    { key: 'f', label: 'quick open' },
    { key: 'b', label: 'buffers' },
    { key: '?', label: 'command palette' },
    { key: 'c', label: 'toggle comment' },
    { key: 'r', label: 'rename' },
    { key: 'a', label: 'code actions' },
    { key: 'h', label: 'hover' },
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
    { key: '(', label: 'from parentheses' },
    { key: '[', label: 'from brackets' },
    { key: '{', label: 'from braces' },
    { key: "'", label: 'from quotes' },
  ],
}

export function prefixHints(pending: string[] | undefined): PrefixHint[] {
  return pending ? (hints[pending.join(' ')] ?? []) : []
}
