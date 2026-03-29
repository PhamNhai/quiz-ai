import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getStaffSession, unauthorized } from '@/lib/staff-auth'

/** Đề đã gán cho lớp + số HS trong lớp đã nộp bài */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    const classId = Number(params.id)
    if (Number.isNaN(classId)) return NextResponse.json({ error: 'ID lớp không hợp lệ' }, { status: 400 })

    const classSize = (await sql`
      SELECT COUNT(*)::int AS c FROM class_students WHERE class_id = ${classId}
    `) as { c: number }[]

    if (session.role === 'school_manager') {
      return NextResponse.json({
        classSize: classSize[0]?.c ?? 0,
        exams: [],
      })
    }

    const examCreatorFilter =
      session.role === 'teacher' ? sql`AND e.created_by = ${session.userId}` : sql``

    const rows = (await sql`
      SELECT e.id, e.exam_code, e.topic, e.subject, e.grade, e.created_at,
        (
          SELECT COUNT(DISTINCT r.student_id)::int FROM results r
          INNER JOIN class_students cs ON cs.id = r.student_id AND cs.class_id = ${classId}
          WHERE r.exam_id = e.id
        ) AS done_count
      FROM exams e
      INNER JOIN exam_classes ec ON ec.exam_id = e.id AND ec.class_id = ${classId}
      WHERE 1=1 ${examCreatorFilter}
      ORDER BY e.created_at DESC
    `) as Array<{
      id: number
      exam_code: string
      topic: string
      subject: string
      grade: string
      created_at: Date | string
      done_count: number
    }>

    return NextResponse.json({
      classSize: classSize[0]?.c ?? 0,
      exams: rows.map(r => ({
        ...r,
        pending_count: Math.max(0, (classSize[0]?.c ?? 0) - r.done_count),
      })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
