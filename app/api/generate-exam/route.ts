import { NextRequest, NextResponse } from 'next/server'
import {
  buildExamPrompt,
  callGemini,
  callGeminiExamStructured,
  extractJSON,
  GEMINI_QUOTA_MESSAGE_VI,
  isGeminiQuotaError,
  normalizeExamQuestions,
} from '@/lib/gemini'
import { isTeacherRequest } from '@/lib/teacher-auth'

export async function POST(req: NextRequest) {
  try {
    if (!(await isTeacherRequest(req)))
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    const { subject, grade, topic, subtopic, count, difficulty, extra } = await req.json()
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
        lastErr = e instanceof Error ? e.message : String(e)
        if (isGeminiQuotaError(e)) {
          return NextResponse.json({ error: GEMINI_QUOTA_MESSAGE_VI }, { status: 429 })
        }
      }
    }
    if (!questions) {
      if (isGeminiQuotaError(lastErr)) {
        return NextResponse.json({ error: GEMINI_QUOTA_MESSAGE_VI }, { status: 429 })
      }
      return NextResponse.json(
        { error: `AI trả về dữ liệu không hợp lệ sau 4 lần thử: ${lastErr}` },
        { status: 500 }
      )
    }

    /** Chưa ghi DB — giáo viên xác nhận ở /teacher/review rồi gọi POST /api/save-exam */
    return NextResponse.json({
      success: true,
      questionCount: questions.length,
      questions,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? 'Lỗi server' }, { status: 500 })
  }
}
