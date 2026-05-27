export type JumpLine = {
  line: number
  text: string
  from?: number
  to?: number
}

export type JumpTargetCore = {
  label: string
  line: number
  start: number
  end: number
  word: string
}

const alphabet = 'asdfghjklqwertyuiopzxcvbnm'

export function jumpLabelNames(): string[] {
  const labels: string[] = []
  for (const a of alphabet) {
    for (const b of alphabet) labels.push(a + b)
  }
  return labels
}

export function isJumpWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch)
}

export function collectJumpTargetsFromLines(lines: JumpLine[]): JumpTargetCore[] {
  const labels = jumpLabelNames()
  const targets: JumpTargetCore[] = []

  for (const line of lines) {
    const from = Math.max(0, line.from ?? 0)
    const to = Math.min(line.text.length, line.to ?? line.text.length)
    let atWord = from > 0 && isJumpWordChar(line.text[from - 1])

    for (let ch = from; ch < to; ch++) {
      const word = isJumpWordChar(line.text[ch])
      if (word && !atWord) {
        const label = labels[targets.length]
        if (!label) return targets
        const end = findJumpWordEnd(line.text, ch)
        targets.push({ label, line: line.line, start: ch, end, word: line.text.slice(ch, end) })
      }
      atWord = word
    }
  }

  return targets
}

export function findJumpWordEnd(text: string, start: number): number {
  let end = start
  while (end < text.length && isJumpWordChar(text[end])) end++
  return end
}
