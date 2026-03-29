import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getExamIfAllowed } from '@/lib/exam-access'
import { forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Khớp tên trong các lớp được gán đề → bổ sung student_id (chỉ response) để có link chi tiết HS. */
async function enrichStudentIds(
  examId: string,
  rows: Array<{
    id: number
    student_name: string
    student_id: number | null
    score: number
    total_questions: number
    percentage: number
    ai_comment: string | null
    submitted_at: Date | string
    attempt_count: number
  }>
) {
  if (!rows.some(r => r.student_id == null)) return rows
  const links = (await sql`
    SELECT class_id FROM exam_classes WHERE exam_id = ${examId}
  `) as { class_id: number }[]
  if (!links.length) return rows

  const byNorm = new Map<string, number[]>()
  for (const { class_id } of links) {
    const part = (await sql`
      SELECT id, display_name FROM class_students WHERE class_id = ${class_id}
    `) as { id: number; display_name: string }[]
    for (const s of part) {
      const k = normName(s.display_name)
      if (!byNorm.has(k)) byNorm.set(k, [])
      byNorm.get(k)!.push(s.id)
    }
  }

  return rows.map(r => {
    if (r.student_id != null) return r
    const ids = byNorm.get(normName(r.student_name))
    if (ids?.length === 1) return { ...r, student_id: ids[0]! }
    return r
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    const allowed = await getExamIfAllowed(session, Number(params.id))
    if (!allowed) return forbidden()
    let rows = (await sql`
      SELECT r.id, r.student_name, r.student_id, r.score, r.total_questions,
        ROUND((r.score / r.total_questions * 100))::int AS percentage,
        r.ai_comment, r.submitted_at,
        (
          SELECT COUNT(*)::int FROM results r2
          WHERE r2.exam_id = r.exam_id
          AND (
            (r.student_id IS NOT NULL AND r2.student_id = r.student_id)
            OR (r.student_id IS NULL AND r2.student_id IS NULL AND r2.student_name = r.student_name)
          )
        ) AS attempt_count
      FROM results r
      WHERE r.exam_id = ${params.id}
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
      attempt_count: number
    }>
    rows = await enrichStudentIds(params.id, rows)
    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
