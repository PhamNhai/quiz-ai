'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GRADES_ALL, SUBJECTS_ALL } from '@/lib/curriculum'
import { ClassMultiSelect } from '@/components/ClassMultiSelect'
import { TeacherRowMenu } from '@/components/TeacherRowMenu'
import s from './manage/manage.module.css'

type ClassRef = { id: number; name: string; student_count?: number; done_count?: number }

type Exam = {
  id: number
  exam_code: string
  topic: string
  subject: string
  grade: string
  difficulty: string
  allow_retake: boolean
  created_at: string
  creator_name?: string
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
  const [codeEdit, setCodeEdit] = useState<{ id: number; draft: string } | null>(null)

  const loadDashboard = useCallback(async () => {
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
  }, [router])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const rMe = await fetch('/api/auth/me', { credentials: 'include' })
        if (rMe.status === 401) {
          router.replace('/teacher/login?next=/teacher')
          return
        }
        const me = await rMe.json()
        if (me?.role === 'school_manager') {
          router.replace('/teacher/classes')
          return
        }
        await loadDashboard()
      } finally {
        setLoading(false)
      }
    })()
  }, [router, loadDashboard])

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

  async function copyToast(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setToast('Đã copy link')
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
    setAssignExam(null)
    setToast('Đã cập nhật lớp cho đề')
    setTimeout(() => setToast(null), 2800)
    await loadDashboard()
  }

  async function saveExamCode() {
    if (!codeEdit) return
    const res = await fetch(`/api/exams/${codeEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ examCode: codeEdit.draft }),
    })
    const data = await res.json()
    if (!res.ok) {
      setToast(data.error ?? 'Không đổi được mã')
      setTimeout(() => setToast(null), 3200)
      return
    }
    setExams(prev =>
      prev.map(x => (x.id === codeEdit.id ? { ...x, exam_code: data.examCode as string } : x))
    )
    setCodeEdit(null)
    setToast('Đã đổi mã đề')
    setTimeout(() => setToast(null), 2400)
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
              <div className={s.modalUrlRow}>
                <p className={s.modalHint}>{qrUrl}</p>
                <button
                  type="button"
                  className={s.btnCopyIcon}
                  title="Copy link"
                  aria-label="Copy link"
                  onClick={() => void copyToast(qrUrl)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M8 3v2h8V3H8zm0 4v12h12V7H8zm2 2h8v8h-8V9zM6 9H4v12h12v-2H6V9z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className={s.modalActions}>
              <button type="button" className={s.btnClose} onClick={() => setQrOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {codeEdit && (
        <div
          className={s.modalBackdrop}
          role="presentation"
          onClick={() => setCodeEdit(null)}
        >
          <div
            className={s.modal}
            role="dialog"
            aria-label="Đổi mã đề"
            onClick={ev => ev.stopPropagation()}
          >
            <h3>Đổi mã đề</h3>
            <p className={s.modalHint}>
              Chỉ chữ không dấu, số, gạch. Không trùng mã khác (không phân biệt hoa thường).
            </p>
            <input
              className={s.search}
              style={{ width: '100%', marginBottom: 12 }}
              value={codeEdit.draft}
              onChange={e => setCodeEdit({ ...codeEdit, draft: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={s.modalActions}>
              <button type="button" className={s.btnMini} onClick={() => setCodeEdit(null)}>
                Hủy
              </button>
              <button type="button" className={s.btnClose} onClick={() => void saveExamCode()}>
                Lưu mã
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
              <ClassMultiSelect
                classes={allClasses.map(c => ({ id: c.id, name: c.name }))}
                selectedIds={Array.from(assignIds)}
                onChange={ids => setAssignIds(new Set(ids))}
                placeholder="Chọn một hoặc nhiều lớp…"
              />
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
        </div>
      </div>

      <div className={s.container}>
        <div>
          <p className={s.lead}>Danh sách đề đã tạo — lọc theo môn hoặc mã đề.</p>
          <p className={s.leadSub}>
            Đề gắn lớp: học sinh phải đúng tên + mật khẩu trong lớp.
          </p>
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
                  <th>Người tạo</th>
                  <th>Kết quả</th>
                  <th>Điểm TB</th>
                  <th>QR</th>
                  <th>Ngày tạo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(ex => (
                  <tr key={ex.id}>
                    <td>
                      <div className={s.codeRow}>
                        <Link href={`/teacher/exams/${ex.id}/edit`} className={s.codeLink}>
                          {ex.exam_code}
                        </Link>
                        <button
                          type="button"
                          className={s.btnEditCode}
                          title="Đổi mã đề"
                          aria-label="Đổi mã đề"
                          onClick={() => setCodeEdit({ id: ex.id, draft: ex.exam_code })}
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                    <td className={s.topic}>{ex.topic}</td>
                    <td>
                      {ex.subject} · {ex.grade}
                    </td>
                    <td className={s.classCol}>
                      <div className={s.classColInner}>
                        <div className={s.classPills}>
                          {ex.classes.length === 0 ? (
                            <span className={s.pill}>—</span>
                          ) : (
                            ex.classes.map(c => (
                              <span key={c.id} className={s.pill} title={c.name}>
                                {c.name}
                                {typeof c.student_count === 'number' ? (
                                  <span className={s.pillFrac}>
                                    {' '}
                                    (
                                    <span className={s.pillDone}>
                                      {typeof c.done_count === 'number' ? c.done_count : 0}
                                    </span>
                                    /{c.student_count})
                                  </span>
                                ) : null}
                              </span>
                            ))
                          )}
                        </div>
                        <button
                          type="button"
                          className={s.btnAssignClass}
                          title="Gán lớp"
                          aria-label="Gán lớp"
                          onClick={() => openAssign(ex)}
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                    <td className={s.tdCreator} title={ex.creator_name ?? ''}>
                      {ex.creator_name ?? '—'}
                    </td>
                    <td>
                      <Link href={`/teacher/stats/${ex.id}`} className={s.rankLink}>
                        Xem
                      </Link>
                    </td>
                    <td>{ex.avg_score != null ? `${ex.avg_score}%` : '—'}</td>
                    <td className={s.tdQr}>
                      <button
                        type="button"
                        className={s.btnQrCell}
                        title="QR làm bài"
                        aria-label="QR làm bài"
                        onClick={() => void openQr(ex)}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path fill="currentColor" d="M3 3h4v4H3V3zm2 2v1H4V5h1zm14-2h4v4h-4V3zm2 2v1h-1V5h1zM3 17h4v4H3v-4zm2 2v1H4v-1h1zm7-14h2v2h-2V5zm0 14h2v2h-2v-2zm-2-7h2v2h-2v-2zm4 0h2v2h-2v-2zm2 0h2v2h-2v-2zm2 0h2v2h-2v-2zm-2 4h2v2h-2v-2zm-4 0h2v2h-2v-2zm-2-4h2v2h-2v-2zm-4 0h2v2H8v-2zm0 4h2v2H8v-2zm4 0h2v2h-2v-2z" />
                        </svg>
                      </button>
                    </td>
                    <td className={s.date}>{new Date(ex.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className={s.tdActions}>
                      <TeacherRowMenu
                        items={[
                          {
                            label: 'Sửa đề',
                            onClick: () => router.push(`/teacher/exams/${ex.id}/edit`),
                          },
                          { label: 'Xóa đề', onClick: () => void deleteExam(ex.id) },
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
