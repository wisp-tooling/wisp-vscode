export type LineCol = { line: number; col: number }

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function lineStarts(text: string): number[] {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

export function offsetToLineCol(text: string, offset: number): LineCol {
  const starts = lineStarts(text)
  const pos = clamp(offset, 0, text.length)
  let line = 0
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i]!
    const next = i + 1 < starts.length ? starts[i + 1]! : text.length + 1
    if (pos >= start && pos < next) {
      line = i
      break
    }
  }
  return { line, col: pos - starts[line]! }
}

export function lineColToOffset(text: string, lc: LineCol): number {
  const starts = lineStarts(text)
  const line = clamp(lc.line, 0, starts.length - 1)
  const start = starts[line]!
  const next = line + 1 < starts.length ? starts[line + 1]! : text.length
  const lineEnd = text[next - 1] === '\n' ? next - 1 : next
  return clamp(start + lc.col, start, lineEnd)
}

export function lineRangeAt(text: string, offset: number): { start: number; end: number; endNoNewline: number } {
  const starts = lineStarts(text)
  const lc = offsetToLineCol(text, offset)
  const start = starts[lc.line]!
  const next = lc.line + 1 < starts.length ? starts[lc.line + 1]! : text.length
  const endNoNewline = text[next - 1] === '\n' ? next - 1 : next
  return { start, end: next, endNoNewline }
}

export function lastLineStart(text: string): number {
  const starts = lineStarts(text)
  return starts[starts.length - 1] ?? 0
}
