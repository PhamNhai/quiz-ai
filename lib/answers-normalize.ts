/** Đáp án nộp có thể là mảng hoặc object { "0": "A", ... } — client gửi Record index. */
export function normalizeStudentAnswers(raw: unknown, questionCount: number): (string | null)[] {
  const out: (string | null)[] = Array.from({ length: questionCount }, () => null)
  if (Array.isArray(raw)) {
    for (let i = 0; i < questionCount; i++) {
      out[i] = normalizeOneLetter(raw[i])
    }
    return out
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (let i = 0; i < questionCount; i++) {
      const v = o[String(i)] ?? (o as Record<number, unknown>)[i]
      out[i] = normalizeOneLetter(v)
    }
    return out
  }
  return out
}

function normalizeOneLetter(v: unknown): string | null {
  if (v == null || v === '') return null
  const s = String(v).trim()
  if (!s) return null
  const u = s.toUpperCase()
  if (u.length === 1 && 'ABCD'.includes(u)) return u
  return s
}
