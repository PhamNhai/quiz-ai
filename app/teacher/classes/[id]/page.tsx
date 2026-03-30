'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  parseStudentRowsFromCsvText,
  parseStudentRowsFromExcelBuffer,
  type StudentImportRow,
} from '@/lib/class-student-import-parse'
import { useStaffMe } from '../../useStaffMe'
import d from './class-detail.module.css'

type Student = { id: number; display_name: string; note: string; created_at: string }
type Act = {
  student_id: number
  display_name: string
  exam_id: number
  exam_code: string
  topic: string
  attempts: number
  last_at: string
}

type ClassExamRow = {
  id: number
  exam_code: string
  topic: string
  subject: string
  grade: string
  done_count: number
  pending_count: number
  created_at: string
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const me = useStaffMe()
  const hideExamUi = me?.role === 'school_manager'
  const [students, setStudents] = useState<Student[]>([])
  const [activity, setActivity] = useState<Act[]>([])
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newNote, setNewNote] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editPw, setEditPw] = useState('')
  const [editNote, setEditNote] = useState('')
  const [csvText, setCsvText] = useState('')
  const [importDraft, setImportDraft] = useState<StudentImportRow[] | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [classExams, setClassExams] = useState<ClassExamRow[]>([])
  const [classSize, setClassSize] = useState(0)

  async function load() {
    const [r1, r2, r3, r4] = await Promise.all([
      fetch(`/api/classes/${id}`, { credentials: 'include' }),
      fetch(`/api/classes/${id}/students`, { credentials: 'include' }),
      fetch(`/api/classes/${id}/activity`, { credentials: 'include' }),
      fetch(`/api/classes/${id}/exams`, { credentials: 'include' }),
    ])
    if (r1.status === 401) {
      router.replace('/teacher/login')
      return
    }
    const c = await r1.json()
    if (c.name) setClassName(c.name)
    const st = await r2.json()
    setStudents(Array.isArray(st) ? st : [])
    const ac = await r3.json()
    setActivity(Array.isArray(ac) ? ac : [])
    if (r4.ok) {
      const ex = await r4.json()
      setClassExams(Array.isArray(ex.exams) ? ex.exams : [])
      setClassSize(typeof ex.classSize === 'number' ? ex.classSize : 0)
    } else {
      setClassExams([])
    }
  }

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      s =>
        s.display_name.toLowerCase().includes(q) ||
        (s.note || '').toLowerCase().includes(q)
    )
  }, [students, studentSearch])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [id])

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newPw) return
    const res = await fetch(`/api/classes/${id}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ displayName: newName.trim(), password: newPw, note: newNote }),
    })
    if (res.ok) {
      setNewName('')
      setNewPw('')
      setNewNote('')
      load()
    } else {
      const j = await res.json()
      alert(j.error || 'Lỗi')
    }
  }

  async function saveEdit(sid: number) {
    const body: Record<string, string> = { displayName: editName, note: editNote }
    if (editPw.trim()) body.password = editPw
    const res = await fetch(`/api/classes/${id}/students/${sid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setEditId(null)
      setEditPw('')
      load()
    } else {
      const j = await res.json()
      alert(j.error || 'Lỗi')
    }
  }

  async function remove(sid: number) {
    if (!confirm('Xóa học sinh này?')) return
    await fetch(`/api/classes/${id}/students/${sid}`, { method: 'DELETE', credentials: 'include' })
    load()
  }

  async function postImportRows(rows: StudentImportRow[]) {
    const res = await fetch(`/api/classes/${id}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rows }),
    })
    const j = await res.json()
    if (!res.ok) {
      alert(j.error ?? 'Lỗi nhập')
      return
    }
    alert(`Nhập: ${j.imported} dòng. ${j.errors?.length ? j.errors.join('\n') : ''}`)
    setCsvText('')
    setImportDraft(null)
    load()
  }

  function openImportDraft(rows: StudentImportRow[]) {
    setImportDraft(rows.map(r => ({ ...r })))
  }

  function updateImportDraftRow(i: number, field: keyof StudentImportRow, v: string) {
    setImportDraft(prev => {
      if (!prev) return null
      const next = [...prev]
      next[i] = { ...next[i]!, [field]: v }
      return next
    })
  }

  async function importCsv() {
    const rows = parseStudentRowsFromCsvText(csvText)
    if (rows.length === 0) {
      alert('Cần CSV: dòng đầu name,password,note (phân cách , hoặc ;)')
      return
    }
    openImportDraft(rows)
  }

  async function onImportFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    const lower = file.name.toLowerCase()
    try {
      let rows: StudentImportRow[]
      if (lower.endsWith('.csv')) {
        const text = await file.text()
        rows = parseStudentRowsFromCsvText(text)
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        const buf = await file.arrayBuffer()
        rows = parseStudentRowsFromExcelBuffer(buf)
      } else {
        alert('Chọn file .csv, .xlsx hoặc .xls')
        return
      }
      if (rows.length === 0) {
        alert('Không đọc được dòng dữ liệu nào (cần dòng tiêu đề + ít nhất một dòng học sinh).')
        return
      }
      openImportDraft(rows)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Không đọc được file')
    }
  }

  return (
    <div className={d.page}>
      {importDraft && (
        <div
          className={d.importBackdrop}
          role="presentation"
          onClick={() => setImportDraft(null)}
        >
          <div
            className={d.importModal}
            role="dialog"
            aria-label="Kiểm tra dữ liệu nhập"
            onClick={ev => ev.stopPropagation()}
          >
            <h2 className={d.importModalTitle}>Kiểm tra trước khi nhập</h2>
            <p className={d.importModalHint}>
              Sửa tên, mật khẩu, ghi chú nếu cần. Chỉ khi ấn Lưu mới gửi lên hệ thống.
            </p>
            <div className={d.importTableScroll}>
              <table className={d.importTable}>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Mật khẩu</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {importDraft.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className={d.importCellInput}
                          value={row.name}
                          onChange={e => updateImportDraftRow(i, 'name', e.target.value)}
                          autoComplete="off"
                        />
                      </td>
                      <td>
                        <input
                          className={d.importCellInput}
                          type="password"
                          value={row.password}
                          onChange={e => updateImportDraftRow(i, 'password', e.target.value)}
                          autoComplete="new-password"
                        />
                      </td>
                      <td>
                        <input
                          className={d.importCellInput}
                          value={row.note}
                          onChange={e => updateImportDraftRow(i, 'note', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={d.importModalActions}>
              <button type="button" className={d.btnModalGhost} onClick={() => setImportDraft(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={d.btnModalPrimary}
                onClick={() => void postImportRows(importDraft)}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      <Link href="/teacher/classes" className={d.back}>
        ← Các lớp
      </Link>
      <h1 className={d.h1}>{className || 'Lớp'}</h1>

      <section className={d.section}>
        <h2 className={d.h2}>Đề gán cho lớp</h2>
        {classExams.length === 0 ? (
          <p className={d.hint}>
            Chưa gán đề nào. Ở màn <strong>Tổng quan đề</strong>, dùng &quot;Gán lớp&quot; cho đề cần học sinh
            lớp này làm.
          </p>
        ) : (
          <ul className={d.examList}>
            {classExams.map(e => (
              <li key={e.id} className={d.examRow}>
                <Link href={`/teacher/classes/${id}/exams/${e.id}`} className={d.examLink}>
                  <span className={d.examCode}>{e.exam_code}</span>
                  <span className={d.examTopic}>{e.topic}</span>
                  <span className={d.examMeta}>
                    {e.subject} · Lớp {e.grade}
                  </span>
                </Link>
                <span className={d.examStat}>
                  {e.done_count}/{classSize || students.length} đã nộp
                  {e.pending_count > 0 ? ` · ${e.pending_count} chưa làm` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={d.section}>
        <h2 className={d.h2}>Thêm học sinh</h2>
        <form onSubmit={addStudent} className={d.form}>
          <input
            className={d.input}
            placeholder="Họ tên (không trùng trong lớp)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <input
            className={d.input}
            type="password"
            placeholder="Mật khẩu"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            required
          />
          <input
            className={d.input}
            placeholder="Ghi chú"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
          />
          <button type="submit" className={d.btn}>
            Thêm
          </button>
        </form>
      </section>

      <section className={d.section}>
        <h2 className={d.h2}>Nhập từ CSV hoặc Excel</h2>
        <p className={d.hint}>
          Dòng đầu tiên: tiêu đề cột (name, password, note hoặc Họ tên, Mật khẩu, Ghi chú). Mỗi dòng sau
          là một học sinh. Có thể chọn file .xlsx / .xls / .csv hoặc dán CSV vào ô dưới.
        </p>
        <label className={d.filePick}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={d.fileInput}
            onChange={e => void onImportFile(e)}
          />
          <span className={d.filePickBtn}>Chọn file Excel / CSV</span>
        </label>
        <p className={d.hint} style={{ marginTop: 10 }}>
          Hoặc dán nội dung CSV:
        </p>
        <textarea
          className={d.textarea}
          rows={5}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder={`name,password,note\n"Nguyễn Văn A",pass123,`}
        />
        <div className={d.importActions}>
          <button type="button" onClick={() => void importCsv()} className={d.btnSec}>
            Nhập từ ô CSV
          </button>
          <a href={`/api/classes/${id}/export`} className={d.link} target="_blank" rel="noreferrer">
            Xuất CSV (mật khẩu để trống - cần đặt lại khi nhập lại)
          </a>
        </div>
      </section>

      <section className={d.section}>
        <h2 className={d.h2}>Học sinh</h2>
        {!loading && students.length > 0 && (
          <div className={d.searchRow}>
            <input
              type="search"
              className={d.searchInput}
              placeholder="Tìm theo tên hoặc ghi chú…"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              aria-label="Tìm học sinh"
            />
            <span className={d.searchMeta}>
              {filteredStudents.length}/{students.length} học sinh
            </span>
          </div>
        )}
        {loading ? (
          <p>Đang tải…</p>
        ) : (
          <div className={d.tableWrap}>
            <table className={d.table}>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Ghi chú</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={d.emptySearch}>
                      {students.length === 0 ? 'Chưa có học sinh.' : 'Không có học sinh khớp tìm kiếm.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => (
                  <tr key={s.id}>
                    {editId === s.id ? (
                      <>
                        <td colSpan={2}>
                          <input
                            className={d.inputSm}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                          />
                          <input
                            className={d.inputSm}
                            type="password"
                            placeholder="Mật khẩu mới (để trống = giữ)"
                            value={editPw}
                            onChange={e => setEditPw(e.target.value)}
                          />
                          <input
                            className={d.inputSm}
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                          />
                        </td>
                        <td>
                          <button type="button" className={d.btnSm} onClick={() => saveEdit(s.id)}>
                            Lưu
                          </button>
                          <button type="button" className={d.btnSmGhost} onClick={() => setEditId(null)}>
                            Hủy
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <Link href={`/teacher/students/${s.id}`} className={d.nameLink}>
                            {s.display_name}
                          </Link>
                        </td>
                        <td>{s.note || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className={d.btnSm}
                            onClick={() => {
                              setEditId(s.id)
                              setEditName(s.display_name)
                              setEditNote(s.note || '')
                              setEditPw('')
                            }}
                          >
                            Sửa
                          </button>
                          <button type="button" className={d.btnSmGhost} onClick={() => remove(s.id)}>
                            Xóa
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!hideExamUi && (
        <section className={d.section}>
          <h2 className={d.h2}>Hoạt động làm bài</h2>
          {activity.length === 0 ? (
            <p className={d.hint}>Chưa có bài nào được nộp (theo học sinh đã xác thực).</p>
          ) : (
            <div className={d.tableWrap}>
              <table className={d.table}>
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th>Mã đề</th>
                    <th>Chủ đề</th>
                    <th>Lần làm</th>
                    <th>Lần cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <Link href={`/teacher/students/${a.student_id}`} className={d.nameLink}>
                          {a.display_name}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/teacher/classes/${id}/exams/${a.exam_id}`} className={d.examCodeLink}>
                          {a.exam_code}
                        </Link>
                      </td>
                      <td>{a.topic}</td>
                      <td>{a.attempts}</td>
                      <td>{new Date(a.last_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
