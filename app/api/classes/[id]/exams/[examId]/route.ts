import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

/**
 * Bảng điểm theo đề trong lớp: mỗi học sinh — đã làm hay chưa, điểm nếu có.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string; examId: string } }) {
  try {
    if (!(await isTeacherRequest(_req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const classId = Number(params.id)
    const examId = Number(params.examId)
    if (Number.isNaN(classId) || Number.isNaN(examId))
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })

    const link = (await sql`
      SELECT 1 FROM exam_classes WHERE class_id = ${classId} AND exam_id = ${examId}
    `) as unknown[]
    if (!link.length) return NextResponse.json({ error: 'Đề không gán cho lớp này' }, { status: 404 })

    const examRows = (await sql`
      SELECT id, exam_code, topic, subject, grade FROM exams WHERE id = ${examId}
    `) as Array<{
      id: number
      exam_code: string
      topic: string
      subject: string
      grade: string
    }>
    if (!examRows.length) return NextResponse.json({ error: 'Không tìm thấy đề' }, { status: 404 })

    const students = (await sql`
      SELECT
        cs.id AS student_id,
        cs.display_name,
        r.id AS result_id,
        r.score,
        r.total_questions,
        CASE WHEN r.total_questions IS NOT NULL AND r.total_questions > 0
          THEN ROUND((r.score / r.total_questions * 100))::int
          ELSE NULL
        END AS percentage,
        r.submitted_at
      FROM class_students cs
      LEFT JOIN LATERAL (
        SELECT id, score, total_questions, submitted_at
        FROM results
        WHERE student_id = cs.id AND exam_id = ${examId}
        ORDER BY submitted_at DESC
        LIMIT 1
      ) r ON true
      WHERE cs.class_id = ${classId}
      ORDER BY cs.display_name
    `) as Array<{
      student_id: number
      display_name: string
      result_id: number | null
      score: number | null
      total_questions: number | null
      percentage: number | null
      submitted_at: Date | string | null
    }>

    return NextResponse.json({
      exam: examRows[0],
      students,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
