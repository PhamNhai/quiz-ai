import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
    if (!code) return NextResponse.json({ error: 'Thiếu mã đề' }, { status: 400 })
    const rows = (await sql`SELECT id FROM exams WHERE exam_code = ${code}`) as { id: number }[]
    if (!rows.length) return NextResponse.json({ error: 'Mã đề không tồn tại' }, { status: 404 })
    return NextResponse.json({ examId: rows[0].id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
