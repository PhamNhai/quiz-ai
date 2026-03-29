import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { canAccessExamRow } from '@/lib/exam-access'
import { getStaffSession, unauthorized } from '@/lib/staff-auth'

/** Lịch sử làm bài của học sinh (class_students.id). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    const sid = Number(params.id)
    if (Number.isNaN(sid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })

    const st = (await sql`
      SELECT id, display_name, class_id FROM class_students WHERE id = ${sid}
    `) as { id: number; display_name: string; class_id: number }[]
    if (!st.length) return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 })

    const cls = (await sql`SELECT name FROM classes WHERE id = ${st[0].class_id}`) as { name: string }[]
    const className = cls[0]?.name ?? ''

    if (session.role === 'school_manager') {
      return NextResponse.json({
        student: { id: st[0].id, displayName: st[0].display_name, classId: st[0].class_id, className },
        attempts: [],
      })
    }

    const rows = (await sql`
      SELECT r.id, r.exam_id, e.exam_code, e.topic, e.subject, e.grade,
        e.created_by,
        r.score, r.total_questions,
        ROUND((r.score / r.total_questions * 100))::int AS percentage,
        r.submitted_at,
        (
          SELECT COUNT(*)::int FROM results r2
          WHERE r2.exam_id = r.exam_id AND r2.student_id = ${sid}
        ) AS attempt_count
      FROM results r
      JOIN exams e ON e.id = r.exam_id
      WHERE r.student_id = ${sid}
      ORDER BY r.submitted_at DESC
    `) as Array<{
      id: number
      exam_id: number
      exam_code: string
      topic: string
      subject: string
      grade: string
      created_by: number | null
      score: number
      total_questions: number
      percentage: number
      submitted_at: Date | string
      attempt_count: number
    }>

    const filtered = rows.filter(row =>
      canAccessExamRow(session, row.created_by ?? null)
    )
    const attempts = filtered.map(({ created_by: _c, ...rest }) => rest)

    return NextResponse.json({
      student: { id: st[0].id, displayName: st[0].display_name, classId: st[0].class_id, className },
      attempts,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
