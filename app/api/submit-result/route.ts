import { NextRequest, NextResponse } from 'next/server'
import { callGemini, buildCommentPrompt } from '@/lib/gemini'
import sql, { type ExamRow } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { examId, studentName, answers } = await req.json()
    if (!examId || !studentName || !answers)
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

    const rows = (await sql`SELECT * FROM exams WHERE id = ${examId}`) as ExamRow[]
    if (!rows.length) return NextResponse.json({ error: 'Đề thi không tồn tại' }, { status: 404 })

    const exam = rows[0]

    // Check allow_retake
    if (!exam.allow_retake) {
      const prev = (await sql`SELECT id FROM results WHERE exam_id = ${examId} AND student_name = ${studentName}`) as { id: number }[]
      if (prev.length > 0)
        return NextResponse.json({ error: 'Đề thi này chỉ được làm một lần.' }, { status: 403 })
    }

    const questions = exam.content as any[]
    let score = 0
    const wrongQuestions: string[] = []
    const detailedResults = questions.map((q, i) => {
      const studentAns = answers[i] ?? null
      const isCorrect  = studentAns === q.answer
      if (isCorrect) score++
      else wrongQuestions.push(q.question.slice(0, 50))
      return { question: q.question, options: q.options, correct: q.answer, studentAnswer: studentAns, isCorrect, explanation: q.explanation }
    })

    const aiComment = await callGemini(buildCommentPrompt({
      subject: exam.subject, score, total: questions.length, studentName, wrongQuestions
    }))

    const saved = (await sql`
      INSERT INTO results (exam_id, student_name, score, total_questions, answers, ai_comment)
      VALUES (${examId}, ${studentName}, ${score}, ${questions.length}, ${JSON.stringify(answers)}, ${aiComment})
      RETURNING id
    `) as { id: number }[]
    return NextResponse.json({
      success: true, resultId: saved[0].id,
      score, total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      aiComment, detailedResults
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? 'Lỗi server' }, { status: 500 })
  }
}
