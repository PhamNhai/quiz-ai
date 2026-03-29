import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getStaffSession } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  const s = await getStaffSession(req)
  if (!s) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  let displayName: string | null = null
  try {
    await initDB()
    const rows = (await sql`
      SELECT display_name FROM staff_users WHERE id = ${s.userId}
    `) as Array<{ display_name: string | null }>
    const dn = rows[0]?.display_name
    displayName = typeof dn === 'string' && dn.trim() ? dn.trim() : null
  } catch {
    /* bỏ qua — vẫn trả username */
  }
  return NextResponse.json({
    userId: s.userId,
    role: s.role,
    username: s.username,
    displayName,
  })
}
