import { NextRequest, NextResponse } from 'next/server'
import { callGemini, buildCommentPrompt } from '@/lib/gemini'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { examId, studentName, answers } = await req.json()
    if (!examId || !studentName || !answers)
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

    const rows = await sql`SELECT * FROM exams WHERE id = ${examId}`
    if (!rows.length) return NextResponse.json({ error: 'Đề thi không tồn tại' }, { status: 404 })

    const exam = rows[0]
    const questions: any[] = exam.content

    let score = 0
    const wrongQuestions: string[] = []
    const detailedResults = questions.map((q, i) => {
      const studentAns = answers[i] ?? null
      const isCorrect  = studentAns === q.answer
      if (isCorrect) score++
      else wrongQuestions.push(q.question.slice(0, 50))
      return {
        question: q.question, options: q.options,
        correct: q.answer, studentAnswer: studentAns,
        isCorrect, explanation: q.explanation
      }
    })

    const aiComment = await callGemini(buildCommentPrompt({
      subject: exam.subject, score, total: questions.length,
      studentName, wrongQuestions
    }))

    const saved = await sql`
      INSERT INTO results (exam_id, student_name, score, total_questions, answers, ai_comment)
      VALUES (${examId}, ${studentName}, ${score}, ${questions.length}, ${JSON.stringify(answers)}, ${aiComment})
      RETURNING id
    `
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
