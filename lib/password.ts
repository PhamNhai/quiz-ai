import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

/** Hash mật khẩu học sinh (salt riêng mỗi bản ghi). */
export function hashPassword(plain: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, 32).toString('hex')
  return { salt, hash }
}

export function verifyPassword(plain: string, salt: string, hash: string): boolean {
  try {
    const h = scryptSync(plain, salt, 32).toString('hex')
    return timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}
