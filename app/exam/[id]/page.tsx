'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import s from './exam.module.css'

type Question = { index: number; question: string; options: Record<string,string> }
type ExamData  = { id: number; topic: string; subject: string; grade: string; questions: Question[] }

export default function ExamPage() {
  const { id }       = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const studentName  = searchParams.get('name') || ''

  const [exam,      setExam]      = useState<ExamData | null>(null)
  const [answers,   setAnswers]   = useState<Record<number, string>>({})
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!studentName) { router.replace('/exam'); return }
    fetch(`/api/exams/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setExam(d) })
      .catch(() => setError('Không tải được đề thi'))
      .finally(() => setLoading(false))
  }, [id, studentName, router])

  async function submit() {
    if (!exam || submitting) return
    const unanswered = exam.questions.filter(q => answers[q.index] === undefined)
    if (unanswered.length > 0) {
      if (!confirm(`Còn ${unanswered.length} câu chưa trả lời. Nộp bài?`)) return
    }
    setSubmitting(true)
    try {
      const res  = await fetch('/api/submit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: id, studentName, answers })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Lưu kết quả vào sessionStorage rồi chuyển trang
      sessionStorage.setItem(`result_${data.resultId}`, JSON.stringify(data))
      router.push(`/result/${data.resultId}`)
    } catch (e: any) { setError(e.message); setSubmitting(false) }
  }

  if (loading) return <div className={s.center}><div className={s.spinner}/></div>
  if (error)   return <div className={s.center}><p className={s.err}>{error}</p></div>
  if (!exam)   return null

  const answered = Object.keys(answers).length
  const total    = exam.questions.length

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <div>
            <div className={s.examMeta}>{exam.subject} · {exam.grade}</div>
            <h1 className={s.examTitle}>{exam.topic}</h1>
          </div>
          <div className={s.progress}>
            <div className={s.progressText}>{answered}/{total}</div>
            <div className={s.progressBar}>
              <div className={s.progressFill} style={{ width: `${(answered/total)*100}%` }}/>
            </div>
          </div>
        </div>
      </header>

      <div className={s.container}>
        <div className={s.studentBadge}>👤 {studentName}</div>

        {exam.questions.map((q, qi) => (
          <div key={q.index} className={s.questionCard}>
            <div className={s.qNum}>Câu {qi + 1}</div>
            <p className={s.qText}>{q.question}</p>
            <div className={s.options}>
              {Object.entries(q.options).map(([k, v]) => (
                <button key={k}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.index]: k }))}
                  className={`${s.option} ${answers[q.index] === k ? s.optionSelected : ''}`}>
                  <span className={s.optionKey}>{k}</span>
                  <span className={s.optionVal}>{v}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <div className={s.error}>{error}</div>}

        <button onClick={submit} disabled={submitting} className={s.btnSubmit}>
          {submitting
            ? <><span className={s.spin}/> Đang chấm bài...</>
            : `Nộp bài (${answered}/${total} câu)`}
        </button>
      </div>
    </div>
  )
}
