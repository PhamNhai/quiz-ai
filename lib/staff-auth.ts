import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const TEACHER_SESSION_COOKIE = 'teacher_session'

export type StaffRole = 'admin' | 'school_manager' | 'teacher'

export type StaffSession = {
  userId: number
  role: StaffRole
  username: string
}

function secretBytes(): Uint8Array {
  return new TextEncoder().encode(
    process.env.TEACHER_AUTH_SECRET ?? 'quiz-ai-teacher-dev-key-change-in-prod'
  )
}

async function hmacKey(): Promise<CryptoKey> {
  const raw = secretBytes()
  return crypto.subtle.importKey(
    'raw',
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '===='.slice(s.length % 4)
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)!
  return out
}

export async function createStaffSessionToken(s: StaffSession): Promise<string> {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000
  const payload = JSON.stringify({
    exp,
    userId: s.userId,
    role: s.role,
    username: s.username,
  })
  const data = new TextEncoder().encode(payload)
  const key = await hmacKey()
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  return `${toBase64Url(data)}.${toBase64Url(sig)}`
}

export async function verifyStaffSessionToken(token: string | undefined): Promise<StaffSession | null> {
  if (!token?.includes('.')) return null
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) return null
  try {
    const data = fromBase64Url(payloadB64)
    const sig = fromBase64Url(sigB64)
    const key = await hmacKey()
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength) as ArrayBuffer,
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
    )
    if (!ok) return null
    const parsed = JSON.parse(new TextDecoder().decode(data)) as {
      exp: number
      userId: number
      role: StaffRole
      username: string
    }
    if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return null
    if (!['admin', 'school_manager', 'teacher'].includes(parsed.role)) return null
    if (typeof parsed.userId !== 'number') return null
    return { userId: parsed.userId, role: parsed.role, username: parsed.username }
  } catch {
    return null
  }
}

export async function getStaffSession(req: NextRequest): Promise<StaffSession | null> {
  return verifyStaffSessionToken(req.cookies.get(TEACHER_SESSION_COOKIE)?.value)
}

/** Đã đăng nhập (bất kỳ role). */
export async function isStaffRequest(req: NextRequest): Promise<boolean> {
  return (await getStaffSession(req)) != null
}

export function hasRole(s: StaffSession, roles: StaffRole[]): boolean {
  return roles.includes(s.role)
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
}

/** Chỉ admin + giáo viên — thao tác đề thi. */
export function canManageExams(s: StaffSession): boolean {
  return s.role === 'admin' || s.role === 'teacher'
}

/** Tạo / đổi tên / xóa lớp. */
export function canManageClasses(s: StaffSession): boolean {
  return s.role === 'admin' || s.role === 'school_manager'
}

/** Tạo tài khoản phụ (giáo viên / phụ lớp) — chỉ adminer. */
export function canManageStaffAccounts(s: StaffSession): boolean {
  return s.role === 'admin' && s.username === 'adminer'
}
