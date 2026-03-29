import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

export async function GET(req: NextRequest) {
  try {
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const rows = (await sql`
      SELECT e.id, e.exam_code, e.topic, e.subject, e.grade, e.difficulty, e.allow_retake, e.created_at,
        COUNT(r.id)::int AS result_count,
        ROUND(AVG(r.score / r.total_questions * 100))::int AS avg_score,
        COALESCE(
          (SELECT json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
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
      result_count: number
      avg_score: number | null
      classes: { id: number; name: string }[] | null
    }>
    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    const { id } = await req.json()
    await sql`DELETE FROM exams WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
