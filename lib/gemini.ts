/** Mặc định: gemini-2.5-flash. Có thể ghi đè bằng GEMINI_MODEL trong .env */
const model = () => process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent?key=${key}`

export async function callGemini(prompt: string, system?: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Thiếu GEMINI_API_KEY')

  const res = await fetch(GEMINI_URL(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: system
        ? { parts: [{ text: system }] }
        : { parts: [{ text: 'Bạn là trợ lý giáo dục chuyên tạo đề thi cho học sinh Việt Nam. Luôn trả về đúng format được yêu cầu.' }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/** Trích mảng JSON từ phản hồi AI (có thể bọc ```json ... ``` hoặc có text thừa). */
export function extractJSON(raw: string): unknown[] {
  let s = raw.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) throw new Error('Không tìm thấy mảng JSON')
  s = s.slice(start, end + 1)
  const parsed = JSON.parse(s) as unknown
  if (!Array.isArray(parsed)) throw new Error('JSON không phải mảng')
  return parsed
}

export function buildExamPrompt(p: {
  subject: string; grade: string; topic: string
  subtopic: string; count: number; difficulty: string; extra: string
}) {
  const diffMap: Record<string, string> = {
    easy:   'Nhận biết — đơn giản, học sinh trung bình làm được',
    medium: 'Thông hiểu — cần hiểu khái niệm',
    hard:   'Vận dụng — cần suy luận, phân tích',
    mixed:  'Hỗn hợp: 40% dễ · 40% trung bình · 20% khó',
  }
  return `Tạo ${p.count} câu trắc nghiệm môn ${p.subject}, ${p.grade}, chủ đề "${p.topic}"${p.subtopic ? `, chuyên đề "${p.subtopic}"` : ''}.
Mức độ: ${diffMap[p.difficulty] ?? p.difficulty}.
${p.extra ? `Yêu cầu thêm: ${p.extra}` : ''}

Trả về MỘT MẢNG JSON DUY NHẤT, không markdown, không giải thích, không text thừa:
[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"..."}]`
}

export function buildCommentPrompt(p: {
  subject: string; score: number; total: number
  studentName: string; wrongQuestions: string[]
}) {
  const pct = Math.round((p.score / p.total) * 100)
  return `Học sinh "${p.studentName}" làm bài ${p.subject}: ${p.score}/${p.total} câu đúng (${pct}%).
${p.wrongQuestions.length > 0 ? `Sai ở: ${p.wrongQuestions.slice(0, 4).join(' | ')}` : ''}
Viết 2-3 câu nhận xét tiếng Việt: khen điểm mạnh, chỉ điểm yếu, gợi ý cải thiện. Thân thiện, khích lệ.`
}
