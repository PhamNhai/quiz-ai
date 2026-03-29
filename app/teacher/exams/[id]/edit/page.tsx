'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ExamEditorForm } from '@/components/ExamEditorForm'
import {
  emptyExamQuestion,
  normalizeExamQuestionsList,
  questionsToJsonPayload,
  validateQuestionsForSave,
  type ExamQuestion,
} from '@/lib/exam-question'
import s from '../../../review/review.module.css'

type ExamHead = {
  id: number
  examCode: string
  topic: string
  subject: string
  grade: string
}

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [head, setHead] = useState<ExamHead | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/teacher/exams/${id}`, { credentials: 'include' })
        if (res.status === 401) {
          router.replace(`/teacher/login?next=${encodeURIComponent(`/teacher/exams/${id}/edit`)}`)
          return
        }
        if (res.status === 403) {
          router.replace('/teacher/classes')
          return
        }
        const d = await res.json()
        if (!res.ok) throw new Error(d.error ?? 'Không tải được đề')
        if (cancelled) return
        setHead({
          id: d.id,
          examCode: d.examCode,
          topic: d.topic,
          subject: d.subject,
          grade: d.grade,
        })
        const list = normalizeExamQuestionsList(Array.isArray(d.questions) ? d.questions : [])
        setQuestions(list.length > 0 ? list : [emptyExamQuestion()])
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Lỗi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, router])

  async function handleSave() {
    const err = validateQuestionsForSave(questions)
    if (err) {
      setError(err)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/update-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          examId: Number(id),
          questions: questionsToJsonPayload(questions),
        }),
      })
      if (res.status === 401) {
        router.replace(`/teacher/login?next=/teacher/exams/${id}/edit`)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/teacher')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.center}>
          <div className={s.spin} />
        </div>
      </div>
    )
  }

  if (error && !head) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <p className={s.error}>{error}</p>
          <Link href="/teacher" className={s.back}>
            ← Tổng quan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/teacher" className={s.back}>
          ← Tổng quan
        </Link>
        <span className={s.navTitle}>Sửa đề</span>
        <span className={s.navBadge}>{questions.length} câu</span>
      </nav>
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1>Xem &amp; sửa đề</h1>
          {head && (
            <p>
              <strong>{head.examCode}</strong> — {head.topic} · {head.subject} · Lớp {head.grade}
            </p>
          )}
          <p style={{ marginTop: 8 }}>
            Chỉnh nội dung câu hỏi, phương án, đáp án đúng; có thể thêm hoặc xóa câu. Bấm Lưu để cập nhật đề đã
            lưu trong hệ thống.
          </p>
        </div>

        <ExamEditorForm questions={questions} onChange={setQuestions} />

        {error && <div className={s.error} style={{ marginTop: 16 }}>{error}</div>}

        <div className={s.footerBar}>
          <p className={s.footerHint}>Thay đổi sẽ áp dụng cho mọi học sinh làm đề từ lúc lưu trở đi.</p>
          <button type="button" onClick={handleSave} disabled={saving} className={s.btnSave}>
            {saving ? (
              <>
                <span className={s.spin} /> Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
