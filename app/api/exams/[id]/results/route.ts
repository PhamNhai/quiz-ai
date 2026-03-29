import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const rows = (await sql`
      SELECT id, student_name, student_id, score, total_questions,
        ROUND((score / total_questions * 100))::int AS percentage,
        ai_comment, submitted_at
      FROM results
      WHERE exam_id = ${params.id}
      ORDER BY percentage DESC, submitted_at ASC
    `) as Array<{
      id: number
      student_name: string
      student_id: number | null
      score: number
      total_questions: number
      percentage: number
      ai_comment: string | null
      submitted_at: Date | string
    }>
    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
