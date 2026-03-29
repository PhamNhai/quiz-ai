import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

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
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    let rows = (await sql`
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
    rows = await enrichStudentIds(params.id, rows)
    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
