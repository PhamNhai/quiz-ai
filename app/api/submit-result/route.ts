import { NextRequest, NextResponse } from 'next/server'
import { callGemini, buildCommentPrompt } from '@/lib/gemini'
import sql, { initDB, type ExamRow } from '@/lib/db'

const GRACE_MS = 120_000 // 2 phút dư cho độ trễ mạng

export async function POST(req: NextRequest) {
  try {
    await initDB()
    const { examId, studentName, studentId, answers, startedAtMs } = await req.json()
    if (!examId || !studentName || !answers)
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

    const rows = (await sql`SELECT * FROM exams WHERE id = ${examId}`) as ExamRow[]
    if (!rows.length) return NextResponse.json({ error: 'Đề thi không tồn tại' }, { status: 404 })

    const exam = rows[0]

    const dur = exam.duration_minutes != null ? Number(exam.duration_minutes) : null
    if (dur != null && dur > 0) {
      const started = Number(startedAtMs)
      if (!started || Number.isNaN(started))
        return NextResponse.json({ error: 'Thiếu thông tin thời gian làm bài' }, { status: 400 })
      if (started > Date.now() + 60_000)
        return NextResponse.json({ error: 'Thời gian bắt đầu không hợp lệ' }, { status: 400 })
      const elapsed = Date.now() - started
      if (elapsed > dur * 60 * 1000 + GRACE_MS)
        return NextResponse.json({ error: 'Đã hết giờ làm bài' }, { status: 403 })
    }

    const classLinks = (await sql`
      SELECT class_id FROM exam_classes WHERE exam_id = ${examId}
    `) as { class_id: number }[]

    if (classLinks.length > 0) {
      if (!studentId)
        return NextResponse.json({ error: 'Thiếu xác thực học sinh' }, { status: 403 })
      const ok = (await sql`
        SELECT cs.id FROM class_students cs
        INNER JOIN exam_classes ec ON ec.class_id = cs.class_id AND ec.exam_id = ${examId}
        WHERE cs.id = ${studentId}
      `) as { id: number }[]
      if (!ok.length)
        return NextResponse.json({ error: 'Đề này không dành cho bạn' }, { status: 403 })
    }

    // Check allow_retake
    if (!exam.allow_retake) {
      if (studentId) {
        const prev = (await sql`
          SELECT id FROM results WHERE exam_id = ${examId} AND student_id = ${studentId}
        `) as { id: number }[]
        if (prev.length > 0)
          return NextResponse.json({ error: 'Đề thi này chỉ được làm một lần.' }, { status: 403 })
      } else {
        const prev = (await sql`
          SELECT id FROM results WHERE exam_id = ${examId} AND student_name = ${studentName} AND student_id IS NULL
        `) as { id: number }[]
        if (prev.length > 0)
          return NextResponse.json({ error: 'Đề thi này chỉ được làm một lần.' }, { status: 403 })
      }
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

    const sid = studentId ? Number(studentId) : null
    const saved = (await sql`
      INSERT INTO results (exam_id, student_name, student_id, score, total_questions, answers, ai_comment)
      VALUES (${examId}, ${studentName}, ${sid}, ${score}, ${questions.length}, ${JSON.stringify(answers)}, ${aiComment})
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
