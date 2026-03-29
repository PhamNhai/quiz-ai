import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { canAccessExamRow } from '@/lib/exam-access'
import { forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    if (session.role === 'school_manager') return NextResponse.json([])

    const rows =
      session.role === 'admin'
        ? ((await sql`
      SELECT e.id, e.exam_code, e.topic, e.subject, e.grade, e.difficulty, e.allow_retake, e.created_at,
        COALESCE(
          (SELECT COALESCE(NULLIF(TRIM(su.display_name), ''), su.username)
           FROM staff_users su WHERE su.id = e.created_by),
          '—'
        ) AS creator_name,
        COUNT(r.id)::int AS result_count,
        ROUND(AVG(r.score / r.total_questions * 100))::int AS avg_score,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'student_count', (SELECT COUNT(*)::int FROM class_students cs2 WHERE cs2.class_id = c.id),
              'done_count', (
                SELECT COUNT(DISTINCT r2.student_id)::int
                FROM results r2
                INNER JOIN class_students cs3 ON cs3.id = r2.student_id AND cs3.class_id = c.id
                WHERE r2.exam_id = e.id
              )
            ) ORDER BY c.name
          )
           FROM exam_classes ec JOIN classes c ON c.id = ec.class_id WHERE ec.exam_id = e.id),
          '[]'::json
        ) AS classes
      FROM exams e
      LEFT JOIN results r ON r.exam_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `) as Array<{
            id: number
            exam_code: string
            topic: string
            subject: string
            grade: string
            difficulty: string
            allow_retake: boolean
            created_at: Date | string
            creator_name: string
            result_count: number
            avg_score: number | null
            classes: {
              id: number
              name: string
              student_count?: number
              done_count?: number
            }[] | null
          }>)
        : ((await sql`
      SELECT e.id, e.exam_code, e.topic, e.subject, e.grade, e.difficulty, e.allow_retake, e.created_at,
        COALESCE(
          (SELECT COALESCE(NULLIF(TRIM(su.display_name), ''), su.username)
           FROM staff_users su WHERE su.id = e.created_by),
          '—'
        ) AS creator_name,
        COUNT(r.id)::int AS result_count,
        ROUND(AVG(r.score / r.total_questions * 100))::int AS avg_score,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'student_count', (SELECT COUNT(*)::int FROM class_students cs2 WHERE cs2.class_id = c.id),
              'done_count', (
                SELECT COUNT(DISTINCT r2.student_id)::int
                FROM results r2
                INNER JOIN class_students cs3 ON cs3.id = r2.student_id AND cs3.class_id = c.id
                WHERE r2.exam_id = e.id
              )
            ) ORDER BY c.name
          )
           FROM exam_classes ec JOIN classes c ON c.id = ec.class_id WHERE ec.exam_id = e.id),
          '[]'::json
        ) AS classes
      FROM exams e
      LEFT JOIN results r ON r.exam_id = e.id
      WHERE e.created_by = ${session.userId}
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `) as Array<{
            id: number
            exam_code: string
            topic: string
            subject: string
            grade: string
            difficulty: string
            allow_retake: boolean
            created_at: Date | string
            creator_name: string
            result_count: number
            avg_score: number | null
            classes: {
              id: number
              name: string
              student_count?: number
              done_count?: number
            }[] | null
          }>)

    return NextResponse.json(rows)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    const { id } = await req.json()
    await initDB()
    const ex = (await sql`SELECT id, created_by FROM exams WHERE id = ${id}`) as Array<{
      id: number
      created_by: number | null
    }>
    if (!ex.length) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (!canAccessExamRow(session, ex[0].created_by)) return forbidden()
    await sql`DELETE FROM exams WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
