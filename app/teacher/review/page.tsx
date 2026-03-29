'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSchoolManagerExamRedirect } from '@/app/teacher/useSchoolManagerExamRedirect'
import { ExamEditorForm } from '@/components/ExamEditorForm'
import {
  normalizeExamQuestionsList,
  questionsToJsonPayload,
  validateQuestionsForSave,
  type ExamQuestion,
} from '@/lib/exam-question'
import s from './review.module.css'

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

type Draft = { questions: unknown[]; meta: DraftMeta }

export default function ReviewPage() {
  useSchoolManagerExamRedirect()
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('review_draft')
    if (!raw) {
      router.replace('/teacher')
      return
    }
    try {
      const parsed = JSON.parse(raw) as Draft
      if (parsed.meta && Array.isArray(parsed.questions)) {
        setDraft(parsed)
        const list = normalizeExamQuestionsList(parsed.questions)
        setQuestions(list.length > 0 ? list : [])
        return
      }
      router.replace('/teacher')
    } catch {
      router.replace('/teacher')
    }
  }, [router])

  async function handleSave() {
    if (!draft) return
    const err = validateQuestionsForSave(questions)
    if (err) {
      setError(err)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/save-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          questions: questionsToJsonPayload(questions),
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
          <h1>Kiểm tra và xác nhận đề</h1>
          <p>
            AI đã tạo bản nháp (chưa lưu DB). Bạn có thể <strong>sửa nội dung câu, phương án, đáp án</strong>,{' '}
            <strong>thêm / xóa câu</strong>, rồi bấm <strong>Lưu đề</strong>.
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

        <ExamEditorForm questions={questions} onChange={setQuestions} />

        {error && <div className={s.error} style={{ marginTop: 16 }}>{error}</div>}

        <div className={s.footerBar}>
          <p className={s.footerHint}>Kiểm tra kỹ trước khi lưu — sau khi lưu, đề xuất hiện ở Tổng quan.</p>
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
