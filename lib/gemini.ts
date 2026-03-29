import { AI_QUOTA_MESSAGE_VI, isGeminiQuotaError } from './ai-quota'
import { callOpenAICompatChat } from './openai-compat'

export { AI_QUOTA_MESSAGE_VI, GEMINI_QUOTA_MESSAGE_VI, isGeminiQuotaError } from './ai-quota'

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

function parseProviderToken(s: string): 'gemini' | 'openai_compat' {
  const p = s.trim().toLowerCase()
  if (p === 'openai_compat' || p === 'openai') return 'openai_compat'
  return 'gemini'
}

/**
 * Thứ tự gọi AI. Có thể đặt `AI_PROVIDER=gemini,openai_compat`.
 * Nếu chỉ một provider và `AI_AUTO_FALLBACK` không phải `false`, tự thêm provider kia khi đã có key tương ứng (hết quota → thử tiếp).
 */
export function getProviderChain(): ('gemini' | 'openai_compat')[] {
  const raw = (process.env.AI_PROVIDER ?? 'gemini').trim()
  const autoFallback = process.env.AI_AUTO_FALLBACK !== 'false'
  if (raw.includes(',')) {
    const seen = new Set<string>()
    const out: ('gemini' | 'openai_compat')[] = []
    for (const part of raw.split(',')) {
      const p = parseProviderToken(part)
      if (seen.has(p)) continue
      seen.add(p)
      out.push(p)
    }
    return out.length ? out : ['gemini']
  }
  const primary = parseProviderToken(raw)
  const out: ('gemini' | 'openai_compat')[] = [primary]
  if (autoFallback) {
    if (primary === 'gemini' && process.env.OPENAI_COMPAT_API_KEY) out.push('openai_compat')
    if (primary === 'openai_compat' && process.env.GEMINI_API_KEY) out.push('gemini')
  }
  return out
}

/** Provider chính (phần tử đầu chuỗi). */
export function getAIProvider(): 'gemini' | 'openai_compat' {
  return getProviderChain()[0] ?? 'gemini'
}

function throwGeminiHttpError(res: Response, errBody: unknown): never {
  const raw =
    typeof errBody === 'object' && errBody !== null ? JSON.stringify(errBody) : String(errBody)
  if (res.status === 429) throw new Error(AI_QUOTA_MESSAGE_VI)
  if (
    res.status === 403 &&
    /quota|RESOURCE_EXHAUSTED|exceeded|GenerateRequestsPerDay/i.test(raw)
  ) {
    throw new Error(AI_QUOTA_MESSAGE_VI)
  }
  throw new Error(`Gemini error ${res.status}: ${raw}`)
}

/** Schema JSON cố định (Gemini JSON mode) — giảm lỗi parse. */
const EXAM_ARRAY_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          'Đề bài. LaTeX trong $...$: mọi lệnh dùng hai dấu \\ (vd \\\\frac) vì JSON.',
      },
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

async function callGeminiApiText(prompt: string, system?: string): Promise<string> {
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
    throwGeminiHttpError(res, err)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function callGemini(prompt: string, system?: string): Promise<string> {
  const chain = getProviderChain()
  let lastQuota: unknown
  for (let i = 0; i < chain.length; i++) {
    const p = chain[i]
    try {
      if (p === 'openai_compat') {
        if (!process.env.OPENAI_COMPAT_API_KEY) continue
        return await callOpenAICompatChat(
          [
            { role: 'system', content: system ?? defaultSystem.parts[0].text },
            { role: 'user', content: prompt },
          ],
          { temperature: 0.55 }
        )
      }
      if (!process.env.GEMINI_API_KEY) continue
      return await callGeminiApiText(prompt, system)
    } catch (e) {
      if (isGeminiQuotaError(e) && i < chain.length - 1) {
        lastQuota = e
        continue
      }
      throw e
    }
  }
  if (lastQuota) throw lastQuota
  throw new Error(
    'Không gọi được AI: thiếu API key (GEMINI_API_KEY hoặc OPENAI_COMPAT_API_KEY) hoặc đã hết hạn mức cả hai.'
  )
}

async function callGeminiApiExamStructured(prompt: string): Promise<unknown[]> {
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
    throwGeminiHttpError(res, err)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text.trim()) throw new Error('Phản hồi rỗng')

  const parsed = JSON.parse(text) as unknown
  if (!Array.isArray(parsed)) throw new Error('Không phải mảng')
  return parsed
}

/**
 * Gọi Gemini JSON + schema; với openai_compat dùng text + extractJSON.
 * Hết quota provider đầu → tự thử provider tiếp theo trong chuỗi (nếu có key).
 */
export async function callGeminiExamStructured(prompt: string): Promise<unknown[]> {
  const chain = getProviderChain()
  let lastQuota: unknown
  for (let i = 0; i < chain.length; i++) {
    const p = chain[i]
    try {
      if (p === 'openai_compat') {
        if (!process.env.OPENAI_COMPAT_API_KEY) continue
        const text = await callOpenAICompatChat(
          [
            { role: 'system', content: defaultSystem.parts[0].text },
            { role: 'user', content: prompt },
          ],
          { temperature: 0.45 }
        )
        if (!text.trim()) throw new Error('Phản hồi rỗng')
        return extractJSON(text)
      }
      if (!process.env.GEMINI_API_KEY) continue
      return await callGeminiApiExamStructured(prompt)
    } catch (e) {
      if (isGeminiQuotaError(e) && i < chain.length - 1) {
        lastQuota = e
        continue
      }
      throw e
    }
  }
  if (lastQuota) throw lastQuota
  throw new Error(
    'Không tạo được đề: thiếu API key hoặc hết hạn mức cả các provider đã cấu hình.'
  )
}

/**
 * JSON.parse coi \\f, \\r, \\t, \\n, \\b là ký tự điều khiển → LaTeX \\frac, \\text, \\rightarrow bị vỡ.
 * Sửa các mảnh phổ biến sau khi đã parse.
 */
export function repairLatexAfterJsonParse(s: string): string {
  if (!s) return s
  let out = s
  // ♀ / ký tự lạ khi hiển thị form feed
  out = out.replace(/♀rac/g, '\\frac')
  out = out.replace(/\u000Crac/g, '\\frac')
  out = out.replace(/\u000Cforall/g, '\\forall')
  out = out.replace(/\u000Dightarrow/g, '\\rightarrow')
  out = out.replace(/\u000Dight(?=[\)\]\}])/g, '\\right')
  out = out.replace(/\u000Dight\(/g, '\\right(')
  out = out.replace(/\u0009ext\{/g, '\\text{')
  out = out.replace(/\u0009ext\b/g, '\\text')
  out = out.replace(/\u0009an\b/g, '\\tan')
  out = out.replace(/\u0009heta/g, '\\theta')
  out = out.replace(/\u000Aeq\b/g, '\\neq')
  out = out.replace(/\u000Aabla/g, '\\nabla')
  out = out.replace(/\u000Aotin/g, '\\notin')
  out = out.replace(/\u0008egin/g, '\\begin')
  out = out.replace(/\u0008eta\b/g, '\\beta')
  out = out.replace(/\u0008inom/g, '\\binom')
  return out
}

/** Kiểm tra từng phần tử có đủ field tối thiểu. */
export function normalizeExamQuestions(raw: unknown[]): any[] {
  return raw.map((item, i) => {
    const q = item as Record<string, unknown>
    if (!q || typeof q.question !== 'string') throw new Error(`Câu ${i + 1}: thiếu question`)
    const opt = q.options as Record<string, string> | undefined
    if (!opt || typeof opt !== 'object') throw new Error(`Câu ${i + 1}: thiếu options`)
    const A = repairLatexAfterJsonParse(opt.A ?? opt.a ?? '')
    const B = repairLatexAfterJsonParse(opt.B ?? opt.b ?? '')
    const C = repairLatexAfterJsonParse(opt.C ?? opt.c ?? '')
    const D = repairLatexAfterJsonParse(opt.D ?? opt.d ?? '')
    for (const [k, v] of Object.entries({ A, B, C, D })) {
      if (typeof v !== 'string' || !v.trim()) throw new Error(`Câu ${i + 1}: thiếu phương án ${k}`)
    }
    const ans = String(q.answer ?? '')
      .trim()
      .toUpperCase()
    if (!['A', 'B', 'C', 'D'].includes(ans)) throw new Error(`Câu ${i + 1}: answer không hợp lệ`)
    return {
      question: repairLatexAfterJsonParse(q.question),
      options: { A, B, C, D },
      answer: ans,
      explanation: repairLatexAfterJsonParse(typeof q.explanation === 'string' ? q.explanation : ''),
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
Toán học — LaTeX trong $...$ hoặc $$...$$.
QUAN TRỌNG (JSON): Trong mỗi chuỗi JSON, mọi lệnh LaTeX bắt đầu bằng \\ phải ghi HAI dấu gạch chéo ngược: ví dụ \\\\frac{a}{b}, \\\\sqrt{x}, \\\\rightarrow, \\\\text{...}, \\\\in, \\\\neq (một dấu \\ sẽ bị JSON hiểu nhầm thành ký tự điều khiển và làm hỏng công thức).
Ví dụ đúng trong JSON: "$x^2$ và $\\\\frac{1}{2}$" — sau khi parse sẽ hiển thị đúng.
`
    : `
Nếu có biểu thức toán, dùng LaTeX trong $...$; trong chuỗi JSON ghi lệnh LaTeX với hai dấu \\\\ như mục toán (\\\\frac, \\\\sqrt, ...).
`

  return `Tạo đúng ${p.count} câu trắc nghiệm 4 phương án (A–D), môn ${p.subject}, khối ${p.grade}, chủ đề "${p.topic}"${p.subtopic ? `, chuyên đề "${p.subtopic}"` : ''}.
Mức độ: ${diffMap[p.difficulty] ?? p.difficulty}.
${p.extra ? `Yêu cầu thêm: ${p.extra}` : ''}
${mathHint}
Mỗi phần tử JSON gồm: question (string), options (object với khóa A,B,C,D), answer ("A"|"B"|"C"|"D"), explanation (string) — giải thích ngắn gọn, chỉ nội dung học thuật, KHÔNG viết lời tự sửa kiểu "Oops", "nhầm", "re-evaluate".
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
  return `Học sinh "${p.studentName}" — ${p.subject}: ${p.score}/${p.total} câu đúng (${pct}%).
${p.wrongQuestions.length > 0 ? `Câu sai gợi ý ôn: ${p.wrongQuestions.slice(0, 3).join('; ')}.` : ''}
Viết tối đa 2–3 câu tiếng Việt, ngắn gọn, không lặp điểm số:
(1) phần nắm chắc hoặc làm tốt (nếu có);
(2) phần còn yếu cần ôn thêm.
Không dùng gạch đầu dòng dài, không khơi chuyện ngoài bài.`
}
