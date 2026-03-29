import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { canManageExams, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

/** Ai làm đề gì, bao nhiêu lần (theo học sinh trong lớp) */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (session.role === 'school_manager') return NextResponse.json([])
    if (!canManageExams(session)) return forbidden()
    await initDB()
    const examFilter =
      session.role === 'teacher' ? sql`AND e.created_by = ${session.userId}` : sql``

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
      WHERE 1=1 ${examFilter}
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
