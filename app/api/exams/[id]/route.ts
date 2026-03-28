import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB()
    const rows = await sql`SELECT * FROM exams WHERE id = ${params.id}`
    if (!rows.length) return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })

    const exam = rows[0]
    // Ẩn đáp án khi trả cho học sinh
    const questions = (exam.content as any[]).map((q, i) => ({
      index: i, question: q.question, options: q.options
    }))
    return NextResponse.json({
      id: exam.id, topic: exam.topic, subject: exam.subject,
      grade: exam.grade, difficulty: exam.difficulty,
      questions, createdAt: exam.created_at
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
