import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getStaffSession, unauthorized } from '@/lib/staff-auth'
import { hashPassword } from '@/lib/password'

/** POST JSON { rows: [{ name, password, note? }] } */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await getStaffSession(req))) return unauthorized()
    const { rows } = await req.json()
    if (!Array.isArray(rows) || rows.length === 0)
      return NextResponse.json({ error: 'Danh sách trống' }, { status: 400 })
    await initDB()

    let ok = 0
    const errors: string[] = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as { name?: string; password?: string; note?: string }
      const name = String(r.name ?? '').trim()
      const pw = String(r.password ?? '')
      const note = String(r.note ?? '').trim()
      if (!name || !pw) {
        errors.push(`Dòng ${i + 1}: thiếu tên hoặc mật khẩu`)
        continue
      }
      try {
        const stored = hashPassword(pw)
        await sql`
          INSERT INTO class_students (class_id, display_name, password_salt, password_hash, note)
          VALUES (${params.id}, ${name}, '', ${stored}, ${note})
        `
        ok++
      } catch (e: any) {
        const msg = e.message ?? ''
        if (msg.includes('unique') || msg.includes('duplicate'))
          errors.push(`Dòng ${i + 1}: trùng tên "${name}"`)
        else errors.push(`Dòng ${i + 1}: ${msg}`)
      }
    }
    return NextResponse.json({ imported: ok, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
