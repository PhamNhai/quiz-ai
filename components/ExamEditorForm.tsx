'use client'

import { useCallback, useRef } from 'react'
import { MathSymbolToolbar, insertAtCursor } from '@/components/MathSymbolToolbar'
import { MathText } from '@/components/MathText'
import type { ExamQuestion } from '@/lib/exam-question'
import { emptyExamQuestion } from '@/lib/exam-question'
import s from './exam-editor-form.module.css'

const KEYS = ['A', 'B', 'C', 'D'] as const
type OptKey = (typeof KEYS)[number]
type FocusField = 'question' | OptKey | 'explanation'

export function ExamEditorForm(props: {
  questions: ExamQuestion[]
  onChange: (next: ExamQuestion[]) => void
}) {
  const { questions, onChange } = props

  function patch(i: number, patchQ: Partial<ExamQuestion>) {
    onChange(questions.map((q, qi) => (qi === i ? { ...q, ...patchQ } : q)))
  }

  function patchOption(i: number, key: OptKey, value: string) {
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
        <QuestionCard
          key={i}
          q={q}
          i={i}
          canRemove={questions.length > 1}
          onPatch={patch}
          onPatchOption={patchOption}
          onRemove={remove}
        />
      ))}

      <button type="button" className={s.addBtn} onClick={add}>
        + Thêm câu hỏi
      </button>
    </div>
  )
}

function QuestionCard(props: {
  q: ExamQuestion
  i: number
  canRemove: boolean
  onPatch: (i: number, patch: Partial<ExamQuestion>) => void
  onPatchOption: (i: number, key: OptKey, value: string) => void
  onRemove: (i: number) => void
}) {
  const { q, i, canRemove, onPatch, onPatchOption, onRemove } = props

  const focusField = useRef<FocusField>('question')
  const refQ = useRef<HTMLTextAreaElement>(null)
  const refA = useRef<HTMLInputElement>(null)
  const refB = useRef<HTMLInputElement>(null)
  const refC = useRef<HTMLInputElement>(null)
  const refD = useRef<HTMLInputElement>(null)
  const refExp = useRef<HTMLTextAreaElement>(null)

  const optRef = useCallback(
    (key: OptKey) => {
      switch (key) {
        case 'A':
          return refA
        case 'B':
          return refB
        case 'C':
          return refC
        case 'D':
          return refD
      }
    },
    []
  )

  const getValue = useCallback(
    (field: FocusField): string => {
      if (field === 'question') return q.question
      if (field === 'explanation') return q.explanation
      return q.options[field]
    },
    [q]
  )

  const setValue = useCallback(
    (field: FocusField, next: string) => {
      if (field === 'question') onPatch(i, { question: next })
      else if (field === 'explanation') onPatch(i, { explanation: next })
      else onPatchOption(i, field, next)
    },
    [i, onPatch, onPatchOption]
  )

  const getEl = useCallback(
    (field: FocusField): HTMLTextAreaElement | HTMLInputElement | null => {
      if (field === 'question') return refQ.current
      if (field === 'explanation') return refExp.current
      return optRef(field).current
    },
    [optRef]
  )

  const insert = useCallback(
    (snippet: string) => {
      const field = focusField.current
      const el = getEl(field)
      const value = getValue(field)
      if (!el) {
        setValue(field, value + snippet)
        return
      }
      const { next, caret } = insertAtCursor(el, value, snippet)
      setValue(field, next)
      requestAnimationFrame(() => {
        el.setSelectionRange(caret, caret)
        el.focus()
      })
    },
    [getEl, getValue, setValue]
  )

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <span className={s.qTitle}>Câu {i + 1}</span>
        <button
          type="button"
          className={s.btnRemove}
          disabled={!canRemove}
          onClick={() => onRemove(i)}
        >
          Xóa câu
        </button>
      </div>

      <div>
        <label className={s.label}>Nội dung câu hỏi</label>
        <MathSymbolToolbar onInsert={insert} />
        <textarea
          ref={refQ}
          className={s.textarea}
          value={q.question}
          onChange={e => onPatch(i, { question: e.target.value })}
          onFocus={() => {
            focusField.current = 'question'
          }}
          rows={3}
          placeholder="Nhập đề bài / câu hỏi (hỗ trợ LaTeX $...$)"
        />
      </div>

      <div className={s.optGrid}>
        {KEYS.map(k => (
          <div key={k} className={s.optRow}>
            <span className={s.optKey}>{k}</span>
            <input
              ref={optRef(k)}
              className={s.input}
              value={q.options[k]}
              onChange={e => onPatchOption(i, k, e.target.value)}
              onFocus={() => {
                focusField.current = k
              }}
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
          onChange={e => onPatch(i, { answer: e.target.value as ExamQuestion['answer'] })}
        >
          {KEYS.map(k => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div className={s.fieldSpaced}>
        <label className={s.label}>Giải thích / gợi ý (tùy chọn)</label>
        <textarea
          ref={refExp}
          className={s.textarea}
          value={q.explanation}
          onChange={e => onPatch(i, { explanation: e.target.value })}
          onFocus={() => {
            focusField.current = 'explanation'
          }}
          rows={2}
          placeholder="Giải thích cho học sinh sau khi nộp bài"
        />
      </div>

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
  )
}
