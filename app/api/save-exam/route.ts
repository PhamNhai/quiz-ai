import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB, generateUniqueCode } from '@/lib/db'
import { canManageExams, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

type Meta = {
  subject: string
  grade: string
  topic: string
  subtopic?: string
  difficulty: string
  allowRetake?: boolean
  classIds?: number[]
  durationMinutes?: number | '' | null
  examCode?: string
  extra?: string
}

/** Lưu đề vào DB lần đầu (sau khi giáo viên duyệt ở màn review). */
export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (!canManageExams(session)) return forbidden()
    const { questions, meta } = (await req.json()) as {
      questions: unknown
      meta: Meta
    }
    if (!questions || !Array.isArray(questions) || questions.length < 1)
      return NextResponse.json({ error: 'Thiếu câu hỏi' }, { status: 400 })
    const m = meta
    if (!m?.subject || !m?.grade || !m?.topic)
      return NextResponse.json({ error: 'Thiếu thông tin đề (môn, khối, chủ đề)' }, { status: 400 })

    await initDB()

    let dur: number | null = null
    if (m.durationMinutes != null && m.durationMinutes !== '') {
      const n = Number(m.durationMinutes)
      if (!isNaN(n) && n >= 1 && n <= 600) dur = Math.floor(n)
    }

    const topicDb =
      m.subtopic && m.subtopic.trim() && m.subtopic.trim() !== m.topic.trim()
        ? `${m.topic.trim()} — ${m.subtopic.trim()}`
        : m.topic.trim()

    const baseCode = (m.examCode ?? '').trim().toUpperCase() || `DE${Date.now().toString(36).toUpperCase()}`
    const finalCode = await generateUniqueCode(baseCode)

    const rows = (await sql`
      INSERT INTO exams (exam_code, topic, subject, grade, difficulty, allow_retake, content, duration_minutes, created_by)
      VALUES (
        ${finalCode},
        ${topicDb},
        ${m.subject},
        ${m.grade},
        ${m.difficulty},
        ${m.allowRetake ?? true},
        ${JSON.stringify(questions)},
        ${dur},
        ${session.userId}
      )
      RETURNING id
    `) as { id: number }[]
    const newId = rows[0].id
    const ids = Array.isArray(m.classIds) ? m.classIds.map(x => Number(x)).filter(n => !isNaN(n)) : []
    for (const cid of ids) {
      await sql`
        INSERT INTO exam_classes (exam_id, class_id) VALUES (${newId}, ${cid})
        ON CONFLICT (exam_id, class_id) DO NOTHING
      `
    }
    return NextResponse.json({
      success: true,
      examId: newId,
      examCode: finalCode,
      questionCount: questions.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    console.error(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
