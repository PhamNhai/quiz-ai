'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GRADES_ALL, SUBJECTS_ALL } from '@/lib/curriculum'
import s from './manage.module.css'

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

export default function ManagePage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    setLoading(true)
    try {
      const res = await fetch('/api/exams', { credentials: 'include' })
      if (res.status === 401) {
        router.replace('/teacher/login?next=/teacher/manage')
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
      router.replace('/teacher/login?next=/teacher/manage')
      return
    }
    loadExams()
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
      <nav className={s.nav}>
        <Link href="/" className={s.back}>
          ← Trang chủ
        </Link>
        <span className={s.navTitle}>Quản lý đề thi</span>
        <div className={s.navRight}>
          <button type="button" onClick={logout} className={s.btnGhost}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className={s.container}>
        <div className={s.pageHead}>
          <div>
            <h1 className={s.h1}>Đề thi của bạn</h1>
            <p className={s.lead}>
              Tìm theo mã đề hoặc lọc theo môn — lên đề mới chỉ khi cần để tiết kiệm API AI.
            </p>
          </div>
          <Link href="/teacher" className={s.btnCreate}>
            + Tạo đề thi
          </Link>
        </div>

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
          <span className={s.total}>{filtered.length} / {exams.length} đề</span>
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
                <Link href="/teacher" className={s.link}>
                  Tạo đề đầu tiên →
                </Link>
              </>
            ) : (
              'Không có đề khớp bộ lọc — thử bỏ lọc hoặc đổi từ khóa.'
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
