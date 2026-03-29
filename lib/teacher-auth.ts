import type { NextRequest } from 'next/server'

export const TEACHER_SESSION_COOKIE = 'teacher_session'

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

/** Cookie session — HMAC, hết hạn 7 ngày (Edge + Node đều chạy được). */
export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000
  const payload = JSON.stringify({ exp })
  const data = new TextEncoder().encode(payload)
  const key = await hmacKey()
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  return `${toBase64Url(data)}.${toBase64Url(sig)}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token?.includes('.')) return false
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) return false
  try {
    const data = fromBase64Url(payloadB64)
    const sig = fromBase64Url(sigB64)
    const { exp } = JSON.parse(new TextDecoder().decode(data)) as { exp: number }
    if (typeof exp !== 'number' || Date.now() > exp) return false
    const key = await hmacKey()
    return crypto.subtle.verify(
      'HMAC',
      key,
      sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength) as ArrayBuffer,
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
    )
  } catch {
    return false
  }
}

export function checkTeacherCredentials(username: string, password: string): boolean {
  const u = process.env.TEACHER_USERNAME ?? 'quizadmin'
  const p = process.env.TEACHER_PASSWORD ?? '12345678'
  return username === u && password === p
}

export async function isTeacherRequest(req: NextRequest): Promise<boolean> {
  return verifySessionToken(req.cookies.get(TEACHER_SESSION_COOKIE)?.value)
}
