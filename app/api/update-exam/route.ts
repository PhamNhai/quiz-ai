import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getExamIfAllowed } from '@/lib/exam-access'
import { forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    const { examId, questions } = await req.json()
    if (!examId || !questions) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
    const exam = await getExamIfAllowed(session, Number(examId))
    if (!exam) return forbidden()
    await sql`UPDATE exams SET content = ${JSON.stringify(questions)} WHERE id = ${examId}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
