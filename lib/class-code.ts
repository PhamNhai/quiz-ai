/** Mã lớp duy nhất: chữ thường, số, gạch (2–64 ký tự). */
export function normalizeClassCode(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '-')
  if (s.length < 2 || s.length > 64) return null
  if (!/^[a-z0-9_-]+$/.test(s)) return null
  return s
}
