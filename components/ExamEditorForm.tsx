'use client'

import { MathText } from '@/components/MathText'
import type { ExamQuestion } from '@/lib/exam-question'
import { emptyExamQuestion } from '@/lib/exam-question'
import s from './exam-editor-form.module.css'

const KEYS = ['A', 'B', 'C', 'D'] as const

export function ExamEditorForm(props: {
  questions: ExamQuestion[]
  onChange: (next: ExamQuestion[]) => void
}) {
  const { questions, onChange } = props

  function patch(i: number, patch: Partial<ExamQuestion>) {
    onChange(questions.map((q, qi) => (qi === i ? { ...q, ...patch } : q)))
  }

  function patchOption(i: number, key: (typeof KEYS)[number], value: string) {
    onChange(
      questions.map((q, qi) =>
        qi === i ? { ...q, options: { ...q.options, [key]: value } } : q
      )
    )
  }

  function remove(i: number) {
    if (questions.length <= 1) return
    if (!confirm(`Xóa câu ${i + 1}?`)) return
    onChange(questions.filter((_, qi) => qi !== i))
  }

  function add() {
    onChange([...questions, emptyExamQuestion()])
  }

  return (
    <div className={s.list}>
      {questions.map((q, i) => (
        <div key={i} className={s.card}>
          <div className={s.cardHead}>
            <span className={s.qTitle}>Câu {i + 1}</span>
            <button
              type="button"
              className={s.btnRemove}
              disabled={questions.length <= 1}
              onClick={() => remove(i)}
            >
              Xóa câu
            </button>
          </div>

          <label className={s.label}>Nội dung câu hỏi</label>
          <textarea
            className={s.textarea}
            value={q.question}
            onChange={e => patch(i, { question: e.target.value })}
            rows={3}
            placeholder="Nhập đề bài / câu hỏi (hỗ trợ LaTeX $...$)"
          />

          <div className={s.optGrid}>
            {KEYS.map(k => (
              <div key={k} className={s.optRow}>
                <span className={s.optKey}>{k}</span>
                <input
                  className={s.input}
                  value={q.options[k]}
                  onChange={e => patchOption(i, k, e.target.value)}
                  placeholder={`Phương án ${k}`}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <label className={s.label}>Đáp án đúng</label>
            <select
              className={s.select}
              value={q.answer}
              onChange={e =>
                patch(i, { answer: e.target.value as ExamQuestion['answer'] })
              }
            >
              {KEYS.map(k => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <label className={s.label} style={{ marginTop: 10 }}>
            Giải thích / gợi ý (tùy chọn)
          </label>
          <textarea
            className={s.textarea}
            value={q.explanation}
            onChange={e => patch(i, { explanation: e.target.value })}
            rows={2}
            placeholder="Giải thích cho học sinh sau khi nộp bài"
          />

          <div className={s.preview}>
            <strong>Preview câu hỏi:</strong>
            <div style={{ marginTop: 6 }}>
              <MathText text={q.question || '…'} as="div" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className={s.addBtn} onClick={add}>
        + Thêm câu hỏi
      </button>
    </div>
  )
}
