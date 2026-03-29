import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

/** Các lần nộp của học sinh cho một đề (mới nhất trước). */
export async function GET(_req: NextRequest, { params }: { params: { id: string; examId: string } }) {
  try {
    if (!(await isTeacherRequest(_req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const sid = Number(params.id)
    const examId = Number(params.examId)
    if (Number.isNaN(sid) || Number.isNaN(examId))
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })

    const st = (await sql`SELECT id FROM class_students WHERE id = ${sid}`) as { id: number }[]
    if (!st.length) return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 })

    const rows = (await sql`
      SELECT r.id, r.score, r.total_questions,
        ROUND((r.score / r.total_questions * 100))::int AS percentage,
        r.submitted_at, r.duration_ms
      FROM results r
      WHERE r.student_id = ${sid} AND r.exam_id = ${examId}
      ORDER BY r.submitted_at DESC
    `) as Array<{
      id: number
      score: number
      total_questions: number
      percentage: number
      submitted_at: Date | string
      duration_ms: number | null
    }>

    return NextResponse.json({ attempts: rows })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
