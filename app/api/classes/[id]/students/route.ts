import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'
import { hashPassword } from '@/lib/password'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isTeacherRequest(req))) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const rows = (await sql`
      SELECT id, display_name, note, created_at
      FROM class_students WHERE class_id = ${params.id}
      ORDER BY display_name ASC
    `) as Array<{ id: number; display_name: string; note: string; created_at: Date | string }>
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/** Thêm một học sinh: { displayName, password, note } */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isTeacherRequest(req))) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    const body = await req.json()
    const displayName = String(body.displayName ?? '').trim()
    const password = String(body.password ?? '')
    const note = String(body.note ?? '').trim()
    if (!displayName || !password)
      return NextResponse.json({ error: 'Cần tên và mật khẩu' }, { status: 400 })
    await initDB()
    const { salt, hash } = hashPassword(password)
    const rows = (await sql`
      INSERT INTO class_students (class_id, display_name, password_salt, password_hash, note)
      VALUES (${params.id}, ${displayName}, ${salt}, ${hash}, ${note})
      RETURNING id, display_name, note, created_at
    `) as Array<{ id: number; display_name: string; note: string; created_at: Date | string }>
    return NextResponse.json(rows[0])
  } catch (e: any) {
    const msg = e.message ?? ''
    if (msg.includes('unique') || msg.includes('duplicate'))
      return NextResponse.json({ error: 'Tên học sinh đã tồn tại trong lớp' }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
