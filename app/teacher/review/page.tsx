'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MathText } from '@/components/MathText'
import s from './review.module.css'

type Question = { question: string; options: Record<string, string>; answer: string; explanation: string }

type DraftMeta = {
  subject: string
  grade: string
  topic: string
  subtopic?: string
  difficulty: string
  extra?: string
  examCode?: string
  allowRetake: boolean
  classIds: number[]
  durationMinutes?: number | ''
}

type Draft = { questions: Question[]; meta: DraftMeta }

export default function ReviewPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('review_draft')
    if (!raw) {
      router.replace('/teacher')
      return
    }
    try {
      const parsed = JSON.parse(raw) as Draft | (Draft & { examId?: number })
      if (parsed.meta && Array.isArray(parsed.questions)) {
        setDraft(parsed as Draft)
        setQuestions(parsed.questions)
        return
      }
      router.replace('/teacher')
    } catch {
      router.replace('/teacher')
    }
  }, [router])

  function setAnswer(i: number, ans: string) {
    setQuestions(prev => prev.map((q, qi) => (qi === i ? { ...q, answer: ans } : q)))
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/save-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          questions,
          meta: {
            ...draft.meta,
            classIds: draft.meta.classIds ?? [],
          },
        }),
      })
      if (res.status === 401) {
        router.replace('/teacher/login?next=/teacher/review')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      sessionStorage.removeItem('review_draft')
      router.push(`/teacher/success?id=${data.examId}&code=${data.examCode}&count=${questions.length}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setSaving(false)
    }
  }

  if (!draft) return <div className={s.center}><div className={s.spin}/></div>

  const m = draft.meta
  const subtopicLabel =
    m.subtopic && m.subtopic.trim() && m.subtopic.trim() !== m.topic.trim()
      ? m.subtopic.trim()
      : null

  const diffLabel: Record<string, string> = {
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó',
    mixed: 'Hỗn hợp',
  }

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
          <p>
            AI đã tạo nội dung câu hỏi (chưa lưu vào hệ thống). Xem lại từng câu, chỉnh đáp án nếu cần, rồi bấm{' '}
            <strong>Lưu đề</strong> để đề xuất hiện trong tổng quan.
          </p>
        </div>

        <div className={s.metaCard} aria-label="Thông tin đề">
          <div className={s.metaRow}>
            <span className={s.metaKey}>Môn</span>
            <span className={s.metaVal}>{m.subject}</span>
          </div>
          <div className={s.metaRow}>
            <span className={s.metaKey}>Khối</span>
            <span className={s.metaVal}>Lớp {m.grade}</span>
          </div>
          <div className={s.metaRow}>
            <span className={s.metaKey}>Chủ đề nhập</span>
            <span className={s.metaVal}>{m.topic}</span>
          </div>
          {subtopicLabel ? (
            <div className={s.metaRow}>
              <span className={s.metaKey}>Chuyên đề gợi ý</span>
              <span className={s.metaVal}>{subtopicLabel}</span>
            </div>
          ) : null}
          <div className={s.metaRow}>
            <span className={s.metaKey}>Mức độ</span>
            <span className={s.metaVal}>{diffLabel[m.difficulty] ?? m.difficulty}</span>
          </div>
        </div>

        <div className={s.questionList}>
          {questions.map((q, i) => (
            <div key={i} className={s.qCard}>
              <div className={s.qHeader}>
                <span className={s.qNum}>Câu {i + 1}</span>
              </div>
              <MathText text={q.question} as="p" className={s.qText} />
              <div className={s.options}>
                {Object.entries(q.options).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAnswer(i, k)}
                    className={`${s.opt} ${q.answer === k ? s.optCorrect : ''}`}
                  >
                    <span className={s.optKey}>{k}</span>
                    <MathText text={v} as="span" className={s.optVal} />
                    {q.answer === k && <span className={s.optTag}>✓ Đáp án đúng</span>}
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
          <button type="button" onClick={handleSave} disabled={saving} className={s.btnSave}>
            {saving ? (
              <>
                <span className={s.spin} /> Đang lưu...
              </>
            ) : (
              '✓  Lưu đề và lấy link chia sẻ'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
