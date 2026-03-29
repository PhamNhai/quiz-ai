import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

export async function POST(req: NextRequest) {
  try {
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    const { examId, questions } = await req.json()
    if (!examId || !questions) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
    await sql`UPDATE exams SET content = ${JSON.stringify(questions)} WHERE id = ${examId}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
