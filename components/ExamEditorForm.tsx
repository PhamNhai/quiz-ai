'use client'

import { useRef } from 'react'
import { MathSymbolToolbar, insertAtCursor } from '@/components/MathSymbolToolbar'
import { MathText } from '@/components/MathText'
import type { ExamQuestion } from '@/lib/exam-question'
import { emptyExamQuestion } from '@/lib/exam-question'
import s from './exam-editor-form.module.css'

const KEYS = ['A', 'B', 'C', 'D'] as const

function FieldWithMathToolbar(props: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
  className?: string
}) {
  const { label, value, onChange, rows = 3, placeholder, className } = props
  const ref = useRef<HTMLTextAreaElement>(null)

  const insert = (snippet: string) => {
    const el = ref.current
    if (!el) {
      onChange(value + snippet)
      return
    }
    const { next, caret } = insertAtCursor(el, value, snippet)
    onChange(next)
    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className={className}>
      <label className={s.label}>{label}</label>
      <p className={s.toolbarHint}>Bộ gõ nhanh (chèn vào ô dưới):</p>
      <MathSymbolToolbar onInsert={insert} />
      <textarea
        ref={ref}
        className={s.textarea}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  )
}

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

          <FieldWithMathToolbar
            label="Nội dung câu hỏi"
            value={q.question}
            onChange={v => patch(i, { question: v })}
            rows={3}
            placeholder="Nhập đề bài / câu hỏi (hỗ trợ LaTeX $...$)"
          />

          <div className={s.optGrid}>
            {KEYS.map(k => (
              <OptionRow
                key={k}
                k={k}
                value={q.options[k]}
                onChange={v => patchOption(i, k, v)}
              />
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

          <FieldWithMathToolbar
            label="Giải thích / gợi ý (tùy chọn)"
            value={q.explanation}
            onChange={v => patch(i, { explanation: v })}
            rows={2}
            placeholder="Giải thích cho học sinh sau khi nộp bài"
            className={s.fieldSpaced}
          />

          <div className={s.preview}>
            <strong>Preview câu hỏi:</strong>
            <div style={{ marginTop: 6 }}>
              <MathText text={q.question || '…'} as="div" />
            </div>
          </div>

          <div className={s.preview}>
            <strong>Preview phương án & đáp án đúng:</strong>
            <ul className={s.optPreviewList}>
              {KEYS.map(k => (
                <li
                  key={k}
                  className={`${s.optPreviewItem} ${k === q.answer ? s.optPreviewCorrect : ''}`}
                >
                  <span className={s.optPreviewKey}>{k}.</span>
                  <span className={s.optPreviewBody}>
                    <MathText text={q.options[k] || '…'} as="span" />
                  </span>
                  {k === q.answer ? (
                    <span className={s.optPreviewBadge}>Đáp án đúng</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      <button type="button" className={s.addBtn} onClick={add}>
        + Thêm câu hỏi
      </button>
    </div>
  )
}

function OptionRow(props: {
  k: (typeof KEYS)[number]
  value: string
  onChange: (v: string) => void
}) {
  const { k, value, onChange } = props
  const ref = useRef<HTMLInputElement>(null)
  const insert = (snippet: string) => {
    const el = ref.current
    if (!el) {
      onChange(value + snippet)
      return
    }
    const { next, caret } = insertAtCursor(el, value, snippet)
    onChange(next)
    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(caret, caret)
    })
  }
  return (
    <div className={s.optRow}>
      <span className={s.optKey}>{k}</span>
      <div className={s.optField}>
        <MathSymbolToolbar onInsert={insert} />
        <input
          ref={ref}
          className={s.input}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Phương án ${k}`}
        />
      </div>
    </div>
  )
}
