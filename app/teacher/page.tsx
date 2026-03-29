'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GRADES_ALL, SUBJECTS_ALL } from '@/lib/curriculum'
import { TeacherRowMenu } from '@/components/TeacherRowMenu'
import s from './manage/manage.module.css'

type ClassRef = { id: number; name: string }

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
  classes: ClassRef[]
}

function parseExamClasses(raw: unknown): ClassRef[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as ClassRef[]
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw) as unknown
      return Array.isArray(j) ? (j as ClassRef[]) : []
    } catch {
      return []
    }
  }
  return []
}

function examEntryUrl(examCode: string): string {
  if (typeof window === 'undefined') return `/exam?code=${encodeURIComponent(examCode)}`
  return `${window.location.origin}/exam?code=${encodeURIComponent(examCode)}`
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [allClasses, setAllClasses] = useState<ClassRef[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const [qrOpen, setQrOpen] = useState(false)
  const [qrSrc, setQrSrc] = useState('')
  const [qrUrl, setQrUrl] = useState('')

  const [assignExam, setAssignExam] = useState<Exam | null>(null)
  const [assignIds, setAssignIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [rExams, rCls] = await Promise.all([
          fetch('/api/exams', { credentials: 'include' }),
          fetch('/api/classes', { credentials: 'include' }),
        ])
        if (rExams.status === 401) {
          router.replace('/teacher/login?next=/teacher')
          return
        }
        const examData = await rExams.json()
        const list = Array.isArray(examData) ? examData : []
        setExams(
          list.map((e: Record<string, unknown>) => ({
            ...e,
            classes: parseExamClasses(e.classes),
          })) as Exam[]
        )
        if (rCls.ok) {
          const cls = await rCls.json()
          setAllClasses(
            Array.isArray(cls)
              ? cls.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name }))
              : []
          )
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

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

  async function copyLink(e: Exam) {
    const url = examEntryUrl(e.exam_code)
    try {
      await navigator.clipboard.writeText(url)
      setToast('Đã copy link làm bài')
      setTimeout(() => setToast(null), 2800)
    } catch {
      setToast('Không copy được — hãy copy thủ công')
      setTimeout(() => setToast(null), 3200)
    }
  }

  async function openQr(e: Exam) {
    const url = examEntryUrl(e.exam_code)
    setQrUrl(url)
    try {
      const QRCode = (await import('qrcode')).default
      const src = await QRCode.toDataURL(url, { margin: 1, width: 240 })
      setQrSrc(src)
      setQrOpen(true)
    } catch {
      setToast('Không tạo được QR')
      setTimeout(() => setToast(null), 2800)
    }
  }

  function openAssign(e: Exam) {
    setAssignExam(e)
    setAssignIds(new Set(e.classes.map(c => c.id)))
  }

  async function saveAssign() {
    if (!assignExam) return
    const res = await fetch(`/api/exams/${assignExam.id}/classes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ classIds: Array.from(assignIds) }),
    })
    if (res.status === 401) {
      router.replace('/teacher/login?next=/teacher')
      return
    }
    const data = await res.json()
    if (!res.ok) {
      setToast(data.error ?? 'Lỗi lưu')
      setTimeout(() => setToast(null), 3200)
      return
    }
    const nextClasses: ClassRef[] = Array.isArray(data.classes)
      ? data.classes.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name }))
      : []
    setExams(prev => prev.map(x => (x.id === assignExam.id ? { ...x, classes: nextClasses } : x)))
    setAssignExam(null)
    setToast('Đã cập nhật lớp cho đề')
    setTimeout(() => setToast(null), 2800)
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
      {qrOpen && (
        <div className={s.modalBackdrop} role="presentation" onClick={() => setQrOpen(false)}>
          <div
            className={s.modal}
            role="dialog"
            aria-label="QR làm bài"
            onClick={ev => ev.stopPropagation()}
          >
            <h3>QR vào làm bài</h3>
            <div className={s.modalQr}>
              {qrSrc ? <img src={qrSrc} alt="" width={240} height={240} /> : null}
              <p className={s.modalHint}>{qrUrl}</p>
            </div>
            <div className={s.modalActions}>
              <button type="button" className={s.btnClose} onClick={() => setQrOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {assignExam && (
        <div className={s.modalBackdrop} role="presentation" onClick={() => setAssignExam(null)}>
          <div
            className={s.modal}
            role="dialog"
            aria-label="Gán lớp"
            onClick={ev => ev.stopPropagation()}
          >
            <h3>Gán đề — {assignExam.exam_code}</h3>
            <p className={s.modalHint}>Chọn lớp được phép làm (học sinh đúng tên + mật khẩu trong lớp).</p>
            {allClasses.length === 0 ? (
              <p className={s.modalHint}>
                Chưa có lớp.{' '}
                <Link href="/teacher/classes" className={s.link}>
                  Tạo lớp →
                </Link>
              </p>
            ) : (
              <>
                <label className={s.modalHint} htmlFor="assign-class-multi">
                  Chọn một hoặc nhiều lớp (giữ Ctrl / ⌘ khi bấm để chọn thêm):
                </label>
                <select
                  id="assign-class-multi"
                  className={s.selectMulti}
                  multiple
                  size={Math.min(10, Math.max(4, allClasses.length))}
                  value={Array.from(assignIds).map(String)}
                  onChange={e => {
                    const ids = Array.from(e.target.selectedOptions, o => Number(o.value))
                    setAssignIds(new Set(ids))
                  }}
                >
                  {allClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <div className={s.modalActions}>
              <button type="button" className={s.btnMini} onClick={() => setAssignExam(null)}>
                Hủy
              </button>
              <button type="button" className={s.btnClose} onClick={() => void saveAssign()}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th>Lớp được gán</th>
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
                    <td className={s.classCol}>
                      <div className={s.classPills}>
                        {e.classes.length === 0 ? (
                          <span className={s.pill}>—</span>
                        ) : (
                          e.classes.map(c => (
                            <span key={c.id} className={s.pill} title={c.name}>
                              {c.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={s.diffBadge}>{diffLabel[e.difficulty] ?? e.difficulty}</span>
                    </td>
                    <td>{e.result_count} bài</td>
                    <td>{e.avg_score != null ? `${e.avg_score}%` : '—'}</td>
                    <td>{e.allow_retake ? 'Nhiều lần' : '1 lần'}</td>
                    <td className={s.date}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className={s.tdActions}>
                      <TeacherRowMenu
                        items={[
                          { label: 'Copy link làm bài', onClick: () => void copyLink(e) },
                          { label: 'QR làm bài', onClick: () => void openQr(e) },
                          { label: 'Kết quả / xếp hạng', onClick: () => router.push(`/teacher/stats/${e.id}`) },
                          { label: 'Gán lớp', onClick: () => openAssign(e) },
                          { label: 'Xóa đề', onClick: () => void deleteExam(e.id) },
                        ]}
                      />
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
