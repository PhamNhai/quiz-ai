import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

/** Ai làm đề gì, bao nhiêu lần (theo học sinh trong lớp) */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isTeacherRequest(req))) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const rows = (await sql`
      SELECT
        cs.id AS student_id,
        cs.display_name,
        e.id AS exam_id,
        e.exam_code,
        e.topic,
        COUNT(r.id)::int AS attempts,
        MAX(r.submitted_at) AS last_at
      FROM results r
      JOIN class_students cs ON cs.id = r.student_id AND cs.class_id = ${params.id}
      JOIN exams e ON e.id = r.exam_id
      GROUP BY cs.id, cs.display_name, e.id, e.exam_code, e.topic
      ORDER BY cs.display_name, e.exam_code
    `) as Array<{
      student_id: number
      display_name: string
      exam_id: number
      exam_code: string
      topic: string
      attempts: number
      last_at: Date | string
    }>
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
