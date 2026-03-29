import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB, type ExamRow } from '@/lib/db'
import { getExamIfAllowed } from '@/lib/exam-access'
import { repairLatexAfterJsonParse } from '@/lib/gemini'
import { canManageExams, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

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
      index: i,
      question: repairLatexAfterJsonParse(String(q.question ?? '')),
      options: Object.fromEntries(
        Object.entries((q.options ?? {}) as Record<string, string>).map(([k, v]) => [
          k,
          repairLatexAfterJsonParse(String(v)),
        ])
      ),
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

/** Đổi mã đề (unique, không phân biệt hoa thường). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (!canManageExams(session)) return forbidden()
    await initDB()
    const examId = Number(params.id)
    if (Number.isNaN(examId)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
    const allowed = await getExamIfAllowed(session, examId)
    if (!allowed) return forbidden()
    const body = await req.json()
    const raw = String(body.examCode ?? body.exam_code ?? '').trim()
    const examCode = raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    if (examCode.length < 2 || examCode.length > 48)
      return NextResponse.json({ error: 'Mã đề 2–48 ký tự (chữ, số, -, _)' }, { status: 400 })
    const dup = (await sql`
      SELECT id FROM exams WHERE id <> ${examId} AND LOWER(exam_code) = LOWER(${examCode})
    `) as { id: number }[]
    if (dup.length)
      return NextResponse.json({ error: 'Mã đề đã tồn tại (trùng không phân biệt hoa thường)' }, { status: 409 })
    await sql`UPDATE exams SET exam_code = ${examCode} WHERE id = ${examId}`
    return NextResponse.json({ ok: true, examCode })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
