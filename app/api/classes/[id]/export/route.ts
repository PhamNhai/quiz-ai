import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

/** CSV: chỉ xuất tên + cột mật khẩu để lưu — mật khẩu không lưu trong DB dạng plaintext, export placeholder "••••" hoặc để trống */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isTeacherRequest(req))) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const rows = (await sql`
      SELECT display_name, note FROM class_students WHERE class_id = ${params.id} ORDER BY display_name
    `) as Array<{ display_name: string; note: string }>
    const header = 'name,password,note'
    const lines = rows.map(r => {
      const name = `"${r.display_name.replace(/"/g, '""')}"`
      const note = `"${(r.note ?? '').replace(/"/g, '""')}"`
      return `${name},,${note}`
    })
    const csv = '\ufeff' + [header, ...lines].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lop-${params.id}-hocsinh.csv"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
