'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

  const seed = useMemo(() => Math.floor(Math.random() * 999999), [])

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
        else setExam(d)
      })
      .catch(() => setError('Không tải được đề thi'))
      .finally(() => setLoading(false))
  }, [id, router])

  const shuffledQuestions = useMemo(
    () => (exam ? shuffle(exam.questions, seed) : []),
    [exam, seed]
  )

  async function submit() {
    if (!exam || submitting) return
    const unanswered = shuffledQuestions.filter(q => answers[q.index] === undefined)
    if (unanswered.length > 0 && !confirm(`Còn ${unanswered.length} câu chưa trả lời. Nộp bài?`)) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: id,
          studentName,
          studentId: studentId ?? undefined,
          answers,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      sessionStorage.setItem(`result_${data.resultId}`, JSON.stringify(data))
      router.push(`/result/${data.resultId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi')
      setSubmitting(false)
    }
  }

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
          <div className={s.progress}>
            <div className={s.progressText}>
              {answered}/{total}
            </div>
            <div className={s.progressBar}>
              <div className={s.progressFill} style={{ width: `${(answered / total) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className={s.container}>
        <div className={s.studentBadge}>👤 {studentName}</div>

        {shuffledQuestions.map((q, qi) => (
          <div key={q.index} className={s.questionCard}>
            <div className={s.qNum}>Câu {qi + 1}</div>
            <p className={s.qText}>{q.question}</p>
            <div className={s.options}>
              {Object.entries(q.options).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAnswers(prev => ({ ...prev, [q.index]: k }))}
                  className={`${s.option} ${answers[q.index] === k ? s.optionSelected : ''}`}
                >
                  <span className={s.optionKey}>{k}</span>
                  <span className={s.optionVal}>{v}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <div className={s.error}>{error}</div>}
        <button type="button" onClick={submit} disabled={submitting} className={s.btnSubmit}>
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
