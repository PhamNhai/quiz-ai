import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { canManageClasses, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await getStaffSession(req))) return unauthorized()
    await initDB()
    const rows = (await sql`SELECT id, name, created_at FROM classes WHERE id = ${params.id}`) as Array<{
      id: number
      name: string
      created_at: Date | string
    }>
    if (!rows.length) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (!canManageClasses(session)) return forbidden()
    const { name } = await req.json()
    const n = String(name ?? '').trim()
    if (!n) return NextResponse.json({ error: 'Thiếu tên lớp' }, { status: 400 })
    await initDB()
    await sql`UPDATE classes SET name = ${n} WHERE id = ${params.id}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (!canManageClasses(session)) return forbidden()
    await initDB()
    await sql`DELETE FROM classes WHERE id = ${params.id}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
