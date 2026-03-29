import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getStaffSession, unauthorized } from '@/lib/staff-auth'
import { toExcelCsv } from '@/lib/csv-excel'

/** CSV: tên + cột mật khẩu để trống (đặt lại khi nhập) — định dạng mở bằng Excel (sep `;`). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await getStaffSession(req))) return unauthorized()
    await initDB()
    const rows = (await sql`
      SELECT display_name, note FROM class_students WHERE class_id = ${params.id} ORDER BY display_name
    `) as Array<{ display_name: string; note: string }>
    const header = ['name', 'password', 'note']
    const data = rows.map(r => [r.display_name, '', r.note ?? ''])
    const csv = toExcelCsv(header, data)
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
