'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GRADES_ALL, SUBJECTS_ALL } from '@/lib/curriculum'
import s from './manage/manage.module.css'

type Exam = {
  id: number
  exam_code: string
  topic: string
  subject: string
  grade: string
  difficulty: string
  allow_retake: boolean
  created_at: string
  result_count: number
  avg_score: number | null
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    setLoading(true)
    try {
      const res = await fetch('/api/exams', { credentials: 'include' })
      if (res.status === 401) {
        router.replace('/teacher/login?next=/teacher')
        return
      }
      const data = await res.json()
      setExams(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function deleteExam(id: number) {
    if (!confirm('Xóa đề này? Toàn bộ kết quả liên quan sẽ bị xóa.')) return
    const res = await fetch('/api/exams', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      credentials: 'include',
    })
    if (res.status === 401) {
      router.replace('/teacher/login?next=/teacher')
      return
    }
    if (res.ok) {
      setExams(prev => prev.filter(e => e.id !== id))
      setToast('Đã xóa đề thành công')
      setTimeout(() => setToast(null), 3200)
    }
  }

  async function logout() {
    await fetch('/api/auth/teacher', { method: 'DELETE', credentials: 'include' })
    router.replace('/teacher/login')
    router.refresh()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exams.filter(e => {
      const matchSubject = !subjectFilter || e.subject === subjectFilter
      const matchGrade = !gradeFilter || e.grade === gradeFilter
      if (!matchSubject || !matchGrade) return false
      if (!q) return true
      return (
        e.exam_code.toLowerCase().includes(q) ||
        e.topic.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.grade.toLowerCase().includes(q)
      )
    })
  }, [exams, search, subjectFilter, gradeFilter])

  const diffLabel: Record<string, string> = {
    easy: 'Dễ',
    medium: 'TB',
    hard: 'Khó',
    mixed: 'Hỗn hợp',
  }

  return (
    <div className={s.page}>
      {toast && <div className={s.toast}>{toast}</div>}
      <div className={s.dashTop}>
        <h1 className={s.h1}>Tổng quan đề thi</h1>
        <div className={s.dashActions}>
          <Link href="/teacher/create" className={s.btnCreate}>
            + Tạo đề mới
          </Link>
          <button type="button" onClick={logout} className={s.btnGhost}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className={s.container}>
        <p className={s.lead}>
          Danh sách đề đã tạo — lọc theo môn hoặc mã đề. Đề gắn lớp: học sinh phải đúng tên + mật khẩu trong lớp.
        </p>

        <div className={s.filters}>
          <input
            className={s.search}
            placeholder="Mã đề, chủ đề, môn, khối…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Tìm kiếm"
          />
          <select
            className={s.select}
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            aria-label="Lọc môn"
          >
            <option value="">Tất cả môn</option>
            {SUBJECTS_ALL.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          <select
            className={s.select}
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            aria-label="Lọc khối"
          >
            <option value="">Tất cả khối</option>
            {GRADES_ALL.map(g => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
          <span className={s.total}>
            {filtered.length} / {exams.length} đề
          </span>
        </div>

        {loading ? (
          <div className={s.center}>
            <div className={s.spin} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>
            {exams.length === 0 ? (
              <>
                Chưa có đề nào.{' '}
                <Link href="/teacher/create" className={s.link}>
                  Tạo đề đầu tiên →
                </Link>
              </>
            ) : (
              'Không có đề khớp bộ lọc.'
            )}
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Mã đề</th>
                  <th>Chủ đề</th>
                  <th>Môn / Lớp</th>
                  <th>Mức độ</th>
                  <th>Kết quả</th>
                  <th>Điểm TB</th>
                  <th>Làm lại</th>
                  <th>Ngày tạo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>
                      <span className={s.code}>{e.exam_code}</span>
                    </td>
                    <td className={s.topic}>{e.topic}</td>
                    <td>
                      {e.subject} · {e.grade}
                    </td>
                    <td>
                      <span className={s.diffBadge}>{diffLabel[e.difficulty] ?? e.difficulty}</span>
                    </td>
                    <td>{e.result_count} bài</td>
                    <td>{e.avg_score != null ? `${e.avg_score}%` : '—'}</td>
                    <td>{e.allow_retake ? 'Nhiều lần' : '1 lần'}</td>
                    <td className={s.date}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className={s.actions}>
                        <Link href={`/teacher/stats/${e.id}`} className={s.btnView}>
                          Kết quả
                        </Link>
                        <button type="button" onClick={() => deleteExam(e.id)} className={s.btnDel}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
