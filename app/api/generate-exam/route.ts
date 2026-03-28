import { NextRequest, NextResponse } from 'next/server'
import { callGemini, buildExamPrompt } from '@/lib/gemini'
import sql, { initDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { subject, grade, topic, subtopic, count, difficulty, extra } = await req.json()
    if (!subject || !grade || !topic || !count)
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })

    const prompt = buildExamPrompt({
      subject, grade, topic,
      subtopic: subtopic ?? '', count: Number(count),
      difficulty, extra: extra ?? ''
    })
    const raw = await callGemini(prompt)

    // Strip markdown fences nếu Gemini bọc trong ```json
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    let questions
    try {
      questions = JSON.parse(cleaned)
      if (!Array.isArray(questions)) throw new Error('not array')
    } catch {
      console.error('Gemini raw response:', raw)
      return NextResponse.json({ error: 'AI trả về dữ liệu không hợp lệ, thử lại.' }, { status: 500 })
    }

    await initDB()
    const rows = await sql`
      INSERT INTO exams (topic, subject, grade, difficulty, content)
      VALUES (${topic}, ${subject}, ${grade}, ${difficulty}, ${JSON.stringify(questions)})
      RETURNING id
    `
    return NextResponse.json({ success: true, examId: rows[0].id, questionCount: questions.length })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? 'Lỗi server' }, { status: 500 })
  }
}
