import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

/** scrypt salt:hash — không cần bcrypt. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const buf = scryptSync(plain, salt, 64)
  return `${salt}:${buf.toString('hex')}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash || hash.length < 32) return false
  try {
    const buf = scryptSync(plain, salt, 64)
    const a = Buffer.from(hash, 'hex')
    const b = buf
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
