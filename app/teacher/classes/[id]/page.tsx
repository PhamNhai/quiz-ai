'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
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

  async function load() {
    const [r1, r2, r3] = await Promise.all([
      fetch(`/api/classes/${id}`, { credentials: 'include' }),
      fetch(`/api/classes/${id}/students`, { credentials: 'include' }),
      fetch(`/api/classes/${id}/activity`, { credentials: 'include' }),
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
  }

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

  async function importCsv() {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) {
      alert('Cần CSV: dòng 1 là name,password,note')
      return
    }
    const rows: { name: string; password: string; note: string }[] = []
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',')
      rows.push({
        name: (parts[0] ?? '').replace(/^"|"$/g, '').trim(),
        password: (parts[1] ?? '').replace(/^"|"$/g, '').trim(),
        note: (parts[2] ?? '').replace(/^"|"$/g, '').trim(),
      })
    }
    const res = await fetch(`/api/classes/${id}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rows }),
    })
    const j = await res.json()
    alert(`Nhập: ${j.imported} dòng. ${j.errors?.length ? j.errors.join('\n') : ''}`)
    setCsvText('')
    load()
  }

  return (
    <div className={d.page}>
      <Link href="/teacher/classes" className={d.back}>
        ← Các lớp
      </Link>
      <h1 className={d.h1}>{className || 'Lớp'}</h1>

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
        <h2 className={d.h2}>Nhập CSV</h2>
        <p className={d.hint}>Dòng đầu: name,password,note - mỗi dòng một học sinh.</p>
        <textarea
          className={d.textarea}
          rows={5}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder={`name,password,note\n"Nguyễn Văn A",pass123,`}
        />
        <button type="button" onClick={importCsv} className={d.btnSec}>
          Nhập từ CSV
        </button>
        <a href={`/api/classes/${id}/export`} className={d.link} target="_blank" rel="noreferrer">
          Xuất CSV (mật khẩu để trống - cần đặt lại khi nhập lại)
        </a>
      </section>

      <section className={d.section}>
        <h2 className={d.h2}>Học sinh</h2>
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
                {students.map(s => (
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
                        <td>{s.display_name}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                    <td>{a.display_name}</td>
                    <td>{a.exam_code}</td>
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
    </div>
  )
}
