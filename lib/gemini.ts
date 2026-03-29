/** Mặc định: gemini-2.5-flash. Có thể ghi đè bằng GEMINI_MODEL trong .env */
const model = () => process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent?key=${key}`

const defaultSystem = {
  parts: [
    {
      text: 'Bạn là trợ lý giáo dục chuyên tạo đề thi cho học sinh Việt Nam. Giữ nguyên dấu tiếng Việt.',
    },
  ],
}

/** Schema JSON cố định (Gemini JSON mode) — giảm lỗi parse. */
const EXAM_ARRAY_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'Đề bài, có thể chứa LaTeX trong $...$' },
      options: {
        type: 'object',
        properties: {
          A: { type: 'string' },
          B: { type: 'string' },
          C: { type: 'string' },
          D: { type: 'string' },
        },
        required: ['A', 'B', 'C', 'D'],
      },
      answer: { type: 'string' },
      explanation: { type: 'string' },
    },
    required: ['question', 'options', 'answer', 'explanation'],
  },
}

export async function callGemini(prompt: string, system?: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Thiếu GEMINI_API_KEY')

  const res = await fetch(GEMINI_URL(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: system
        ? { parts: [{ text: system }] }
        : { parts: [defaultSystem.parts[0]] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.55, maxOutputTokens: 8192 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/**
 * Gọi Gemini với responseMimeType = JSON + schema mảng câu hỏi.
 * Trả về mảng đã parse (ổn định hơn so với text tự do).
 */
export async function callGeminiExamStructured(prompt: string): Promise<unknown[]> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Thiếu GEMINI_API_KEY')

  const res = await fetch(GEMINI_URL(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [defaultSystem.parts[0]] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: EXAM_ARRAY_SCHEMA,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini JSON mode ${res.status}: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text.trim()) throw new Error('Phản hồi rỗng')

  const parsed = JSON.parse(text) as unknown
  if (!Array.isArray(parsed)) throw new Error('Không phải mảng')
  return parsed
}

/** Kiểm tra từng phần tử có đủ field tối thiểu. */
export function normalizeExamQuestions(raw: unknown[]): any[] {
  return raw.map((item, i) => {
    const q = item as Record<string, unknown>
    if (!q || typeof q.question !== 'string') throw new Error(`Câu ${i + 1}: thiếu question`)
    const opt = q.options as Record<string, string> | undefined
    if (!opt || typeof opt !== 'object') throw new Error(`Câu ${i + 1}: thiếu options`)
    const A = opt.A ?? opt.a ?? ''
    const B = opt.B ?? opt.b ?? ''
    const C = opt.C ?? opt.c ?? ''
    const D = opt.D ?? opt.d ?? ''
    for (const [k, v] of Object.entries({ A, B, C, D })) {
      if (typeof v !== 'string' || !v.trim()) throw new Error(`Câu ${i + 1}: thiếu phương án ${k}`)
    }
    const ans = String(q.answer ?? '')
      .trim()
      .toUpperCase()
    if (!['A', 'B', 'C', 'D'].includes(ans)) throw new Error(`Câu ${i + 1}: answer không hợp lệ`)
    return {
      question: q.question,
      options: { A, B, C, D },
      answer: ans,
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
    }
  })
}

/** Trích mảng JSON từ phản hồi text (fallback khi không dùng JSON mode). */
export function extractJSON(raw: string): unknown[] {
  let s = raw.trim()
  if (!s) throw new Error('Phản hồi rỗng')

  try {
    const direct = JSON.parse(s) as unknown
    if (Array.isArray(direct)) return direct
  } catch {
    /* tiếp */
  }

  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()

  try {
    const direct2 = JSON.parse(s) as unknown
    if (Array.isArray(direct2)) return direct2
  } catch {
    /* tiếp */
  }

  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) throw new Error('Không tìm thấy mảng JSON')
  s = s.slice(start, end + 1)

  try {
    const parsed = JSON.parse(s) as unknown
    if (!Array.isArray(parsed)) throw new Error('JSON không phải mảng')
    return parsed
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Parse JSON thất bại: ${msg}`)
  }
}

export function buildExamPrompt(p: {
  subject: string
  grade: string
  topic: string
  subtopic: string
  count: number
  difficulty: string
  extra: string
}) {
  const diffMap: Record<string, string> = {
    easy: 'Nhận biết — đơn giản, học sinh trung bình làm được',
    medium: 'Thông hiểu — cần hiểu khái niệm',
    hard: 'Vận dụng — cần suy luận, phân tích',
    mixed: 'Hỗn hợp: 40% dễ · 40% trung bình · 20% khó',
  }
  const isMath =
    /toán|math/i.test(p.subject) || /toán|math|số|hình|đại số|giải tích/i.test(p.topic + p.subtopic)

  const mathHint = isMath
    ? `
Toán học: mọi công thức, biểu thức, ký hiệu toán phải viết bằng LaTeX trong cặp dấu đôla $...$ (inline), ví dụ: $x^2+1$, $\\frac{a}{b}$, $\\sqrt{2}$, $\\int_0^1 f(x)\\,dx$. Có thể dùng $$...$$ cho công thức hiển thị riêng dòng.
`
    : `
Nếu có biểu thức toán/công thức, cũng dùng LaTeX trong $...$ như trên.
`

  return `Tạo đúng ${p.count} câu trắc nghiệm 4 phương án (A–D), môn ${p.subject}, khối ${p.grade}, chủ đề "${p.topic}"${p.subtopic ? `, chuyên đề "${p.subtopic}"` : ''}.
Mức độ: ${diffMap[p.difficulty] ?? p.difficulty}.
${p.extra ? `Yêu cầu thêm: ${p.extra}` : ''}
${mathHint}
Mỗi phần tử JSON gồm: question (string), options (object với khóa A,B,C,D), answer ("A"|"B"|"C"|"D"), explanation (string).
Chỉ trả về MẢNG JSON theo schema, không markdown, không chữ thừa ngoài JSON.`
}

export function buildCommentPrompt(p: {
  subject: string
  score: number
  total: number
  studentName: string
  wrongQuestions: string[]
}) {
  const pct = Math.round((p.score / p.total) * 100)
  return `Học sinh "${p.studentName}" làm bài ${p.subject}: ${p.score}/${p.total} câu đúng (${pct}%).
${p.wrongQuestions.length > 0 ? `Sai ở: ${p.wrongQuestions.slice(0, 4).join(' | ')}` : ''}
Viết 2-3 câu nhận xét tiếng Việt: khen điểm mạnh, chỉ điểm yếu, gợi ý cải thiện. Thân thiện, khích lệ.`
}
