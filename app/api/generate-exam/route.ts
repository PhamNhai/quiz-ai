import { NextRequest, NextResponse } from 'next/server'
import { callGemini, buildExamPrompt, extractJSON } from '@/lib/gemini'
import sql, { initDB, generateUniqueCode } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { subject, grade, topic, subtopic, count, difficulty, extra, examCode, allowRetake } = await req.json()
    if (!subject || !grade || !topic || !count)
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })

    const prompt = buildExamPrompt({
      subject, grade, topic,
      subtopic: subtopic ?? '',
      count: Number(count),
      difficulty,
      extra: extra ?? ''
    })

    // Retry tối đa 2 lần nếu JSON lỗi
    let questions: any[] | null = null
    let lastErr = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callGemini(prompt)
        questions = extractJSON(raw)
        break
      } catch (e: any) {
        lastErr = e.message
      }
    }
    if (!questions) {
      return NextResponse.json({ error: `AI trả về dữ liệu không hợp lệ sau 2 lần thử: ${lastErr}` }, { status: 500 })
    }

    await initDB()

    // Xử lý mã đề
    const baseCode = (examCode ?? '').trim().toUpperCase() || `DE${Date.now().toString(36).toUpperCase()}`
    const finalCode = await generateUniqueCode(baseCode)

    const rows = (await sql`
      INSERT INTO exams (exam_code, topic, subject, grade, difficulty, allow_retake, content)
      VALUES (${finalCode}, ${topic}, ${subject}, ${grade}, ${difficulty}, ${allowRetake ?? true}, ${JSON.stringify(questions)})
      RETURNING id
    `) as { id: number }[]
    return NextResponse.json({
      success: true,
      examId: rows[0].id,
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
