'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MathText } from '@/components/MathText'
import s from './exam.module.css'

type Question = { index: number; question: string; options: Record<string, string> }
type ExamData = {
  id: number
  examCode: string
  topic: string
  subject: string
  grade: string
  questions: Question[]
  restrictedToClasses?: boolean
  durationMinutes?: number | null
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s2 = seed
  for (let i = a.length - 1; i > 0; i--) {
    s2 = (s2 * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s2) % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fmtMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const sec2 = sec % 60
  return `${m}:${sec2.toString().padStart(2, '0')}`
}

export default function ExamPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<ExamData | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [expired, setExpired] = useState(false)

  const answersRef = useRef<Record<number, string>>({})
  const startedAtMsRef = useRef<number | null>(null)
  const submittingRef = useRef(false)
  const examRef = useRef<ExamData | null>(null)
  const shuffledRef = useRef<Question[]>([])

  const seed = useMemo(() => Math.floor(Math.random() * 999999), [])

  useEffect(() => {
    submittingRef.current = submitting
  }, [submitting])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    examRef.current = exam
  }, [exam])

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(`exam_auth_${id}`) : null
    let name = ''
    let sid: number | null = null
    if (raw) {
      try {
        const p = JSON.parse(raw) as { studentName?: string; studentId?: number | null }
        name = p.studentName ?? ''
        sid = p.studentId ?? null
      } catch {
        /* empty */
      }
    }
    if (!name) {
      router.replace('/exam')
      return
    }
    setStudentName(name)
    setStudentId(sid)

    fetch(`/api/exams/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else {
          if (d.restrictedToClasses && sid == null) {
            router.replace(`/exam?code=${encodeURIComponent(String(d.examCode ?? ''))}`)
            return
          }
          setExam(d)
        }
      })
      .catch(() => setError('Không tải được đề thi'))
      .finally(() => setLoading(false))
  }, [id, router])

  const shuffledQuestions = useMemo(
    () => (exam ? shuffle(exam.questions, seed) : []),
    [exam, seed]
  )

  useEffect(() => {
    shuffledRef.current = shuffledQuestions
  }, [shuffledQuestions])

  const runSubmit = useCallback(
    async (fromTimeout: boolean) => {
      const ex = examRef.current
      if (!ex) return
      if (submittingRef.current) return
      submittingRef.current = true
      if (!fromTimeout) {
        const unanswered = shuffledRef.current.filter(q => answersRef.current[q.index] === undefined)
        if (unanswered.length > 0 && !confirm(`Còn ${unanswered.length} câu chưa trả lời. Nộp bài?`)) {
          submittingRef.current = false
          return
        }
      }
      setSubmitting(true)
      setError('')
      try {
        const body: Record<string, unknown> = {
          examId: id,
          studentName,
          studentId: studentId ?? undefined,
          answers: answersRef.current,
        }
        if (ex.durationMinutes && ex.durationMinutes > 0 && startedAtMsRef.current != null) {
          body.startedAtMs = startedAtMsRef.current
        }
        const res = await fetch('/api/submit-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        sessionStorage.setItem(`result_${data.resultId}`, JSON.stringify(data))
        router.push(`/result/${data.resultId}`)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Lỗi')
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [id, router, studentId, studentName]
  )

  const runSubmitRef = useRef(runSubmit)
  runSubmitRef.current = runSubmit

  useEffect(() => {
    const ex = exam
    if (!ex?.durationMinutes || ex.durationMinutes <= 0) {
      setSecondsLeft(null)
      return
    }
    const totalSec = ex.durationMinutes * 60
    const key = `exam_timer_${ex.id}`
    let start = Date.now()
    const prev = sessionStorage.getItem(key)
    if (prev) {
      try {
        const p = JSON.parse(prev) as { start?: number }
        if (typeof p.start === 'number') start = p.start
      } catch {
        /* empty */
      }
    } else {
      sessionStorage.setItem(key, JSON.stringify({ start }))
    }
    startedAtMsRef.current = start

    let ended = false
    const iv = setInterval(() => {
      if (ended) return
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const left = Math.max(0, totalSec - elapsed)
      setSecondsLeft(left)
      if (left <= 0 && !ended) {
        ended = true
        clearInterval(iv)
        setExpired(true)
        void runSubmitRef.current(true)
      }
    }, 1000)

    const elapsed0 = Math.floor((Date.now() - start) / 1000)
    const left0 = Math.max(0, totalSec - elapsed0)
    setSecondsLeft(left0)
    if (left0 <= 0) {
      ended = true
      clearInterval(iv)
      setExpired(true)
      void runSubmitRef.current(true)
    }

    return () => clearInterval(iv)
  }, [exam?.id, exam?.durationMinutes])

  if (loading) {
    return (
      <div className={s.center}>
        <div className={s.spinner} />
      </div>
    )
  }
  if (error && !exam) {
    return (
      <div className={s.center}>
        <p className={s.err}>{error}</p>
        <a href="/exam" className={s.errLink}>
          ← Quay lại
        </a>
      </div>
    )
  }
  if (!exam) return null

  const answered = Object.keys(answers).length
  const total = exam.questions.length
  const locked = expired || submitting
  const danger = secondsLeft != null && secondsLeft <= 60 && secondsLeft > 0

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <div>
            <div className={s.examMeta}>
              {exam.subject} · {exam.grade} · Mã đề: {exam.examCode}
            </div>
            <h1 className={s.examTitle}>{exam.topic}</h1>
          </div>
          <div className={s.headerRight}>
            {secondsLeft != null && (
              <div className={`${s.timer} ${danger ? s.timerDanger : ''}`}>
                ⏱ {fmtMmSs(secondsLeft)}
              </div>
            )}
            <div className={s.progress}>
              <div className={s.progressText}>
                {answered}/{total}
              </div>
              <div className={s.progressBar}>
                <div className={s.progressFill} style={{ width: `${(answered / total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={s.container}>
        <div className={s.studentBadge}>👤 {studentName}</div>

        {expired && (
          <div className={s.expiredBanner}>
            Hết giờ làm bài. Câu chưa chọn không được tính điểm. Đang nộp bài…
          </div>
        )}

        {shuffledQuestions.map((q, qi) => (
          <div key={q.index} className={`${s.questionCard} ${locked ? s.questionDisabled : ''}`}>
            <div className={s.qNum}>Câu {qi + 1}</div>
            <MathText text={q.question} as="p" className={s.qText} />
            <div className={s.options}>
              {Object.entries(q.options).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return
                    setAnswers(prev => ({ ...prev, [q.index]: k }))
                  }}
                  className={`${s.option} ${answers[q.index] === k ? s.optionSelected : ''}`}
                >
                  <span className={s.optionKey}>{k}</span>
                  <MathText text={v} as="span" className={s.optionVal} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <div className={s.error}>{error}</div>}
        <button
          type="button"
          onClick={() => runSubmit(false)}
          disabled={locked}
          className={s.btnSubmit}
        >
          {submitting ? (
            <>
              <span className={s.spin} /> Đang chấm bài...
            </>
          ) : (
            `Nộp bài (${answered}/${total} câu)`
          )}
        </button>
      </div>
    </div>
  )
}
