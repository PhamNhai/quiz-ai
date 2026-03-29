'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MathText } from '@/components/MathText'
import s from './review.module.css'

type Question = { question: string; options: Record<string,string>; answer: string; explanation: string }
type Draft = { examId: number; examCode: string; questionCount: number; questions: Question[] }

export default function ReviewPage() {
  const router = useRouter()
  const [draft,    setDraft]    = useState<Draft | null>(null)
  const [questions,setQuestions]= useState<Question[]>([])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('review_draft')
    if (!raw) { router.replace('/teacher'); return }
    const d: Draft = JSON.parse(raw)
    setDraft(d)
    setQuestions(d.questions)
  }, [router])

  function setAnswer(i: number, ans: string) {
    setQuestions(prev => prev.map((q, qi) => qi === i ? { ...q, answer: ans } : q))
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true); setError('')
    try {
      const res  = await fetch('/api/update-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ examId: draft.examId, questions })
      })
      if (res.status === 401) {
        router.replace('/teacher/login?next=/teacher/review')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      sessionStorage.removeItem('review_draft')
      router.push(`/teacher/success?id=${draft.examId}&code=${draft.examCode}&count=${questions.length}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!draft) return <div className={s.center}><div className={s.spin}/></div>

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/teacher/create" className={s.back}>← Tạo lại</Link>
        <span className={s.navTitle}>Kiểm tra đáp án</span>
        <span className={s.navBadge}>{questions.length} câu</span>
      </nav>
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1>Kiểm tra và xác nhận đáp án</h1>
          <p>AI đã tạo xong đề. Xem lại từng câu, chỉnh đáp án nếu cần, rồi bấm Lưu đề.</p>
        </div>

        <div className={s.questionList}>
          {questions.map((q, i) => (
            <div key={i} className={s.qCard}>
              <div className={s.qHeader}>
                <span className={s.qNum}>Câu {i+1}</span>
              </div>
              <MathText text={q.question} as="p" className={s.qText} />
              <div className={s.options}>
                {Object.entries(q.options).map(([k, v]) => (
                  <button key={k} onClick={() => setAnswer(i, k)}
                    className={`${s.opt} ${q.answer===k ? s.optCorrect : ''}`}>
                    <span className={s.optKey}>{k}</span>
                    <MathText text={v} as="span" className={s.optVal} />
                    {q.answer===k && <span className={s.optTag}>✓ Đáp án đúng</span>}
                  </button>
                ))}
              </div>
              {q.explanation && (
                <div className={s.explanation}>
                  💡 <MathText text={q.explanation} as="span" />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <div className={s.error}>{error}</div>}

        <div className={s.footerBar}>
          <p className={s.footerHint}>Click vào đáp án để thay đổi. Đáp án đúng hiển thị màu xanh.</p>
          <button onClick={handleSave} disabled={saving} className={s.btnSave}>
            {saving ? <><span className={s.spin}/> Đang lưu...</> : '✓  Lưu đề và lấy link chia sẻ'}
          </button>
        </div>
      </div>
    </div>
  )
}
