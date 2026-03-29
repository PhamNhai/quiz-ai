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
import { canManageExams, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    if (!canManageExams(session)) return forbidden()
    const { subject, grade, topic, subtopic, count, difficulty, extra } = await req.json()
    if (!subject || !grade || !topic || count == null || count === '')
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    const n = Number(count)
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      return NextResponse.json({ error: 'Số câu phải từ 1 đến 100' }, { status: 400 })
    }

    const prompt = buildExamPrompt({
      subject, grade, topic,
      subtopic: subtopic ?? '',
      count: n,
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
