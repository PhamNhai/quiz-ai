import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB, type ExamRow } from '@/lib/db'
import { getExamIfAllowed } from '@/lib/exam-access'
import { repairLatexAfterJsonParse } from '@/lib/gemini'
import { forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

function normAns(a: unknown): string {
  const s = String(a ?? 'A')
    .trim()
    .toUpperCase()
    .slice(0, 1)
  return ['A', 'B', 'C', 'D'].includes(s) ? s : 'A'
}

/** Đề đầy đủ (có đáp án) — chỉ giáo viên đăng nhập. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    const examId = Number(params.id)
    if (Number.isNaN(examId)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
    const allowed = await getExamIfAllowed(session, examId)
    if (!allowed) return forbidden()
    const exam = allowed
    const ec = (await sql`SELECT COUNT(*)::int AS c FROM exam_classes WHERE exam_id = ${params.id}`) as { c: number }[]
    const restrictedToClasses = (ec[0]?.c ?? 0) > 0
    const rawList = exam.content as any[]
    const durationMin =
      exam.duration_minutes != null && Number(exam.duration_minutes) > 0
        ? Number(exam.duration_minutes)
        : null

    const questions = rawList.map(q => {
      const o = (q.options ?? {}) as Record<string, string>
      return {
        question: repairLatexAfterJsonParse(String(q.question ?? '')),
        options: {
          A: repairLatexAfterJsonParse(String(o.A ?? o.a ?? '')),
          B: repairLatexAfterJsonParse(String(o.B ?? o.b ?? '')),
          C: repairLatexAfterJsonParse(String(o.C ?? o.c ?? '')),
          D: repairLatexAfterJsonParse(String(o.D ?? o.d ?? '')),
        },
        answer: normAns(q.answer),
        explanation: repairLatexAfterJsonParse(String(q.explanation ?? '')),
      }
    })

    return NextResponse.json({
      id: exam.id,
      examCode: exam.exam_code,
      topic: exam.topic,
      subject: exam.subject,
      grade: exam.grade,
      difficulty: exam.difficulty,
      allowRetake: exam.allow_retake,
      questions,
      createdAt: exam.created_at,
      restrictedToClasses,
      durationMinutes: durationMin,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
