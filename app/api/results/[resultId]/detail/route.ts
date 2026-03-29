import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'
import { repairLatexAfterJsonParse } from '@/lib/gemini'

export async function GET(_req: NextRequest, { params }: { params: { resultId: string } }) {
  try {
    if (!(await isTeacherRequest(_req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    await initDB()
    const rid = Number(params.resultId)
    if (Number.isNaN(rid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })

    const rows = (await sql`
      SELECT r.id, r.exam_id, r.student_name, r.student_id, r.score, r.total_questions,
        r.answers, r.ai_comment, r.submitted_at, r.duration_ms,
        e.exam_code, e.topic, e.subject, e.grade, e.duration_minutes, e.content,
        cs.display_name AS student_display_name
      FROM results r
      INNER JOIN exams e ON e.id = r.exam_id
      LEFT JOIN class_students cs ON cs.id = r.student_id
      WHERE r.id = ${rid}
    `) as Array<{
      id: number
      exam_id: number
      student_name: string
      student_id: number | null
      score: number
      total_questions: number
      answers: unknown
      ai_comment: string | null
      submitted_at: Date | string
      duration_ms: number | null
      exam_code: string
      topic: string
      subject: string
      grade: string
      duration_minutes: number | null
      content: unknown
      student_display_name: string | null
    }>

    if (!rows.length) return NextResponse.json({ error: 'Không tìm thấy bài nộp' }, { status: 404 })

    const r = rows[0]
    const questionsRaw = r.content as unknown
    const questions = Array.isArray(questionsRaw) ? questionsRaw : []
    const answersArr = (Array.isArray(r.answers) ? r.answers : []) as (string | null)[]

    const items = questions.map((q: Record<string, unknown>, i: number) => {
      const studentAns = answersArr[i] ?? null
      const correct = String(q.answer ?? '')
      const isCorrect = studentAns === correct
      const opts = (q.options ?? {}) as Record<string, string>
      return {
        index: i + 1,
        question: repairLatexAfterJsonParse(String(q.question ?? '')),
        options: Object.fromEntries(
          Object.entries(opts).map(([k, v]) => [k, repairLatexAfterJsonParse(String(v))])
        ),
        correct,
        studentAnswer: studentAns,
        isCorrect,
        explanation: repairLatexAfterJsonParse(String(q.explanation ?? '')),
      }
    })

    return NextResponse.json({
      result: {
        id: r.id,
        exam_id: r.exam_id,
        score: r.score,
        total_questions: r.total_questions,
        percentage:
          r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
        submitted_at:
          typeof r.submitted_at === 'string' ? r.submitted_at : new Date(r.submitted_at).toISOString(),
        duration_ms: r.duration_ms,
        ai_comment: r.ai_comment,
      },
      exam: {
        id: r.exam_id,
        exam_code: r.exam_code,
        topic: r.topic,
        subject: r.subject,
        grade: r.grade,
        duration_minutes: r.duration_minutes,
      },
      student: {
        id: r.student_id,
        displayName: r.student_display_name ?? r.student_name,
      },
      questions: items,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
