'use client'

import { useCallback, useEffect, useState } from 'react'
import { MathText } from '@/components/MathText'
import s from './teacher-result-modal.module.css'

type Q = {
  index: number
  question: string
  options: Record<string, string>
  correct: string
  studentAnswer: string | null
  isCorrect: boolean
  explanation: string
}

type DetailPayload = {
  result: {
    id: number
    exam_id: number
    score: number
    total_questions: number
    percentage: number
    submitted_at: string
    duration_ms: number | null
    ai_comment: string | null
  }
  exam: {
    id: number
    exam_code: string
    topic: string
    subject: string
    grade: string
    duration_minutes: number | null
  }
  student: { id: number | null; displayName: string }
  questions: Q[]
}

type Attempt = {
  id: number
  score: number
  total_questions: number
  percentage: number
  submitted_at: string
  duration_ms: number | null
}

function fmtDuration(ms: number | null) {
  if (ms == null) return '—'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m} phút ${sec} giây`
  return `${sec} giây`
}

function fmtLimit(min: number | null) {
  if (min == null || min <= 0) return 'Không giới hạn'
  return `${min} phút`
}

export function TeacherResultDetailModal(props: {
  open: boolean
  onClose: () => void
  /** Có thể thiếu (HS không gắn lớp) — chỉ xem một bài, không gộp nhiều lần. */
  studentId?: number | null
  examId: number
  initialResultId: number
}) {
  const { open, onClose, studentId, examId, initialResultId } = props
  const canListAttempts = studentId != null && studentId > 0
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [selectedId, setSelectedId] = useState<number>(initialResultId)
  const [detail, setDetail] = useState<DetailPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const loadAttempts = useCallback(async () => {
    if (!canListAttempts) {
      setAttempts([])
      setSelectedId(initialResultId)
      return
    }
    const r = await fetch(`/api/students/${studentId}/exam/${examId}/attempts`, {
      credentials: 'include',
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error ?? 'Không tải được danh sách lần làm')
    const list = Array.isArray(d.attempts) ? (d.attempts as Attempt[]) : []
    setAttempts(list)
    const ids = new Set(list.map(a => a.id))
    if (ids.has(initialResultId)) setSelectedId(initialResultId)
    else if (list.length) setSelectedId(list[0]!.id)
    else setSelectedId(initialResultId)
  }, [canListAttempts, studentId, examId, initialResultId])

  const loadDetail = useCallback(async (resultId: number) => {
    setLoading(true)
    setErr('')
    try {
      const r = await fetch(`/api/results/${resultId}/detail`, { credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Lỗi tải chi tiết')
      setDetail(d as DetailPayload)
    } catch (e: unknown) {
      setDetail(null)
      setErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setDetail(null)
    setErr('')
    loadAttempts().catch(e => setErr(e instanceof Error ? e.message : 'Lỗi'))
  }, [open, loadAttempts, canListAttempts])

  useEffect(() => {
    if (!open || !selectedId) return
    loadDetail(selectedId)
  }, [open, selectedId, loadDetail])

  if (!open) return null

  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal
      aria-labelledby="trdm-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={s.panel} onClick={e => e.stopPropagation()}>
        <div className={s.head}>
          <div>
            <h2 id="trdm-title" className={s.title}>
              Chi tiết bài làm
            </h2>
            {detail && (
              <p className={s.sub}>
                {detail.exam.exam_code} · {detail.exam.topic}
              </p>
            )}
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {canListAttempts && attempts.length > 1 && (
          <div className={s.attemptRow}>
            <label htmlFor="trdm-attempt">Chọn lần nộp</label>
            <select
              id="trdm-attempt"
              className={s.select}
              value={selectedId}
              onChange={e => setSelectedId(Number(e.target.value))}
            >
              {attempts.map((a, idx) => (
                <option key={a.id} value={a.id}>
                  Lần {attempts.length - idx} —{' '}
                  {new Date(a.submitted_at).toLocaleString('vi-VN')} — {a.score}/{a.total_questions} (
                  {a.percentage}%)
                </option>
              ))}
            </select>
          </div>
        )}

        {detail && (
          <>
            <div className={s.meta}>
              <div>
                <div className={s.metaLabel}>Học sinh</div>
                <div className={s.metaVal}>{detail.student.displayName}</div>
              </div>
              <div>
                <div className={s.metaLabel}>Nộp lúc</div>
                <div className={s.metaVal}>
                  {new Date(detail.result.submitted_at).toLocaleString('vi-VN')}
                </div>
              </div>
              <div>
                <div className={s.metaLabel}>Thời gian làm bài</div>
                <div className={s.metaVal}>{fmtDuration(detail.result.duration_ms)}</div>
              </div>
              <div>
                <div className={s.metaLabel}>Giới hạn đề</div>
                <div className={s.metaVal}>{fmtLimit(detail.exam.duration_minutes)}</div>
              </div>
              <div>
                <div className={s.metaLabel}>Điểm</div>
                <div className={s.metaVal}>
                  {detail.result.score}/{detail.result.total_questions} ({detail.result.percentage}%)
                </div>
              </div>
              {canListAttempts && attempts.length > 0 ? (
                <div>
                  <div className={s.metaLabel}>Lần làm đề này</div>
                  <div className={s.metaVal}>{attempts.length} lần</div>
                </div>
              ) : null}
            </div>
          </>
        )}

        <div className={s.body}>
          {loading && <div className={s.loading}>Đang tải...</div>}
          {err && !loading && <div className={s.err}>{err}</div>}
          {!loading && detail && (
            <>
              {detail.result.ai_comment ? (
                <p className={s.exp} style={{ marginBottom: '1rem' }}>
                  <strong>Nhận xét AI:</strong> {detail.result.ai_comment}
                </p>
              ) : null}
              {detail.questions.map(q => (
                <div key={q.index} className={s.q}>
                  <div className={s.qHead}>
                    <span className={s.qNum}>Câu {q.index}</span>
                    <span className={`${s.badge} ${q.isCorrect ? s.ok : s.bad}`}>
                      {q.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  </div>
                  <div className={s.qText}>
                    <MathText text={q.question} as="div" />
                  </div>
                  <ul className={s.opts}>
                    {Object.entries(q.options).map(([k, v]) => {
                      const isAns = k === q.correct
                      const isPick = q.studentAnswer === k
                      const optClass = isAns ? s.optCorrect : isPick ? s.optStudent : ''
                      return (
                        <li key={k}>
                          <strong>{k}.</strong>{' '}
                          <span className={optClass}>
                            <MathText text={v} as="span" />
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  {!q.isCorrect && !q.studentAnswer ? (
                    <p className={s.sumLabel} style={{ marginTop: 8 }}>
                      Chưa chọn đáp án.
                    </p>
                  ) : null}
                  {q.explanation ? (
                    <div className={s.exp}>
                      <MathText text={q.explanation} as="div" />
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
