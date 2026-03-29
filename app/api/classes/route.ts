import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { canManageClasses, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  try {
    if (!(await getStaffSession(req))) return unauthorized()
    await initDB()
    const rows = (await sql`
      SELECT c.id, c.name, c.created_at,
        COUNT(s.id)::int AS student_count
      FROM classes c
      LEFT JOIN class_students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `) as Array<{ id: number; name: string; created_at: Date | string; student_count: number }>
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (!canManageClasses(session)) return forbidden()
    const { name } = await req.json()
    const n = String(name ?? '').trim()
    if (!n) return NextResponse.json({ error: 'Thiếu tên lớp' }, { status: 400 })
    await initDB()
    const rows = (await sql`
      INSERT INTO classes (name) VALUES (${n}) RETURNING id, name, created_at
    `) as Array<{ id: number; name: string; created_at: Date | string }>
    return NextResponse.json(rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
