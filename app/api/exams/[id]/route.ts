import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB, type ExamRow } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB()
    const rows = (await sql`SELECT * FROM exams WHERE id = ${params.id}`) as ExamRow[]
    if (!rows.length) return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })

    const exam = rows[0]
    const ec = (await sql`SELECT COUNT(*)::int AS c FROM exam_classes WHERE exam_id = ${params.id}`) as { c: number }[]
    const restrictedToClasses = (ec[0]?.c ?? 0) > 0
    // Ẩn đáp án khi trả cho học sinh
    const questions = (exam.content as any[]).map((q, i) => ({
      index: i, question: q.question, options: q.options
    }))
    const durationMin =
      exam.duration_minutes != null && Number(exam.duration_minutes) > 0
        ? Number(exam.duration_minutes)
        : null
    return NextResponse.json({
      id: exam.id, examCode: exam.exam_code, topic: exam.topic,
      subject: exam.subject, grade: exam.grade, difficulty: exam.difficulty,
      allowRetake: exam.allow_retake, questions, createdAt: exam.created_at,
      restrictedToClasses,
      durationMinutes: durationMin,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
