import { NextRequest, NextResponse } from 'next/server'
import { getStaffSession } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  const s = await getStaffSession(req)
  if (!s) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  return NextResponse.json({
    userId: s.userId,
    role: s.role,
    username: s.username,
  })
}
