import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getStaffSession, unauthorized } from '@/lib/staff-auth'
import { hashPassword } from '@/lib/password'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; sid: string } }
) {
  try {
    if (!(await getStaffSession(req))) return unauthorized()
    const body = await req.json()
    const displayName = body.displayName != null ? String(body.displayName).trim() : undefined
    const password = body.password != null ? String(body.password) : undefined
    const note = body.note != null ? String(body.note).trim() : undefined
    await initDB()

    const cur = (await sql`
      SELECT id FROM class_students WHERE id = ${params.sid} AND class_id = ${params.id}
    `) as { id: number }[]
    if (!cur.length) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    if (displayName !== undefined) {
      await sql`UPDATE class_students SET display_name = ${displayName} WHERE id = ${params.sid}`
    }
    if (note !== undefined) {
      await sql`UPDATE class_students SET note = ${note} WHERE id = ${params.sid}`
    }
    if (password !== undefined && password.length > 0) {
      const stored = hashPassword(password)
      await sql`
        UPDATE class_students SET password_salt = '', password_hash = ${stored} WHERE id = ${params.sid}
      `
    }

    const rows = (await sql`
      SELECT id, display_name, note, created_at FROM class_students WHERE id = ${params.sid}
    `) as Array<{ id: number; display_name: string; note: string; created_at: Date | string }>
    return NextResponse.json(rows[0])
  } catch (e: any) {
    const msg = e.message ?? ''
    if (msg.includes('unique') || msg.includes('duplicate'))
      return NextResponse.json({ error: 'Tên học sinh đã tồn tại trong lớp' }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sid: string } }
) {
  try {
    if (!(await getStaffSession(req))) return unauthorized()
    await initDB()
    await sql`DELETE FROM class_students WHERE id = ${params.sid} AND class_id = ${params.id}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
