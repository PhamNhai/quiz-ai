import { NextRequest, NextResponse } from 'next/server'
import {
  buildExamPrompt,
  callGemini,
  callGeminiExamStructured,
  extractJSON,
  normalizeExamQuestions,
} from '@/lib/gemini'
import sql, { initDB, generateUniqueCode } from '@/lib/db'
import { isTeacherRequest } from '@/lib/teacher-auth'

export async function POST(req: NextRequest) {
  try {
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    const { subject, grade, topic, subtopic, count, difficulty, extra, examCode, allowRetake, classIds, durationMinutes } = await req.json()
    if (!subject || !grade || !topic || !count)
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })

    const prompt = buildExamPrompt({
      subject, grade, topic,
      subtopic: subtopic ?? '',
      count: Number(count),
      difficulty,
      extra: extra ?? ''
    })

    // Ưu tiên JSON mode + schema; fallback parse text (4 lần)
    let questions: any[] | null = null
    let lastErr = ''
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const rawList =
          attempt < 2 ? await callGeminiExamStructured(prompt) : extractJSON(await callGemini(prompt))
        questions = normalizeExamQuestions(rawList)
        break
      } catch (e: any) {
        lastErr = e.message
      }
    }
    if (!questions) {
      return NextResponse.json(
        { error: `AI trả về dữ liệu không hợp lệ sau 4 lần thử: ${lastErr}` },
        { status: 500 }
      )
    }

    await initDB()

    let dur: number | null = null
    if (durationMinutes != null && durationMinutes !== '') {
      const n = Number(durationMinutes)
      if (!isNaN(n) && n >= 1 && n <= 600) dur = Math.floor(n)
    }

    // Xử lý mã đề
    const baseCode = (examCode ?? '').trim().toUpperCase() || `DE${Date.now().toString(36).toUpperCase()}`
    const finalCode = await generateUniqueCode(baseCode)

    const rows = (await sql`
      INSERT INTO exams (exam_code, topic, subject, grade, difficulty, allow_retake, content, duration_minutes)
      VALUES (${finalCode}, ${topic}, ${subject}, ${grade}, ${difficulty}, ${allowRetake ?? true}, ${JSON.stringify(questions)}, ${dur})
      RETURNING id
    `) as { id: number }[]
    const newId = rows[0].id
    const ids = Array.isArray(classIds) ? classIds.map((x: unknown) => Number(x)).filter(n => !isNaN(n)) : []
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
      // Trả về questions để giáo viên review
      questions
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? 'Lỗi server' }, { status: 500 })
  }
}
