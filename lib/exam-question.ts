export type ExamQuestion = {
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

const KEYS = ['A', 'B', 'C', 'D'] as const

export function emptyExamQuestion(): ExamQuestion {
  return {
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    answer: 'A',
    explanation: '',
  }
}

function normAns(a: unknown): 'A' | 'B' | 'C' | 'D' {
  const s = String(a ?? 'A')
    .trim()
    .toUpperCase()
    .slice(0, 1)
  return (KEYS.includes(s as 'A') ? s : 'A') as 'A' | 'B' | 'C' | 'D'
}

/** Chuẩn hóa từ API / draft (options có thể là Record rộng). */
export function normalizeExamQuestion(raw: unknown): ExamQuestion {
  const q = raw as Record<string, unknown>
  const o = (q.options ?? {}) as Record<string, string>
  return {
    question: String(q.question ?? ''),
    options: {
      A: String(o.A ?? o.a ?? ''),
      B: String(o.B ?? o.b ?? ''),
      C: String(o.C ?? o.c ?? ''),
      D: String(o.D ?? o.d ?? ''),
    },
    answer: normAns(q.answer),
    explanation: String(q.explanation ?? ''),
  }
}

export function normalizeExamQuestionsList(raw: unknown[]): ExamQuestion[] {
  return raw.map(normalizeExamQuestion)
}

export function validateQuestionsForSave(questions: ExamQuestion[]): string | null {
  if (questions.length < 1) return 'Cần ít nhất một câu hỏi'
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!
    if (!q.question.trim()) return `Câu ${i + 1}: thiếu nội dung câu hỏi`
    for (const k of KEYS) {
      if (!q.options[k].trim()) return `Câu ${i + 1}: thiếu phương án ${k}`
    }
  }
  return null
}

/** Gửi API / lưu DB — object thuần, đáp án chữ hoa. */
export function questionsToJsonPayload(questions: ExamQuestion[]) {
  return questions.map(q => ({
    question: q.question.trim(),
    options: { ...q.options },
    answer: q.answer,
    explanation: q.explanation.trim(),
  }))
}
