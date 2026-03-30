'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStaffMe } from '../useStaffMe'
import s from './classes.module.css'

type Cls = {
  id: number
  name: string
  code: string
  note: string
  student_count: number
  created_at: string
}

export default function ClassesPage() {
  const router = useRouter()
  const me = useStaffMe()
  const [list, setList] = useState<Cls[]>([])
  const [name, setName] = useState('')
  const [classNote, setClassNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [edit, setEdit] = useState<Cls | null>(null)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const canManageClass = me?.role === 'admin' || me?.role === 'school_manager'

  async function load() {
    const res = await fetch('/api/classes', { credentials: 'include' })
    if (res.status === 401) {
      router.replace('/teacher/login?next=/teacher/classes')
      return
    }
    const d = await res.json()
    setList(Array.isArray(d) ? d : [])
  }

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: n, note: classNote.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setName('')
      setClassNote('')
      load()
      setToast('Đã tạo lớp')
      setTimeout(() => setToast(null), 2400)
    } else {
      setToast(data.error ?? 'Không tạo được')
      setTimeout(() => setToast(null), 3200)
    }
  }

  function openEdit(c: Cls) {
    setEdit(c)
    setEditName(c.name)
    setEditNote(c.note ?? '')
  }

  async function saveEdit() {
    if (!edit) return
    const n = editName.trim()
    if (!n) {
      setToast('Tên lớp không được để trống')
      setTimeout(() => setToast(null), 2800)
      return
    }
    const res = await fetch(`/api/classes/${edit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: n, note: editNote.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setEdit(null)
      load()
      setToast('Đã lưu lớp')
      setTimeout(() => setToast(null), 2400)
    } else {
      setToast(data.error ?? 'Không lưu được')
      setTimeout(() => setToast(null), 3200)
    }
  }

  async function removeCls(c: Cls) {
    if (!confirm(`Xóa lớp "${c.name}"? Học sinh và dữ liệu liên quan trong lớp sẽ mất.`)) return
    const res = await fetch(`/api/classes/${c.id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      load()
      setToast('Đã xóa lớp')
      setTimeout(() => setToast(null), 2400)
    } else {
      const data = await res.json().catch(() => ({}))
      setToast(data.error ?? 'Không xóa được')
      setTimeout(() => setToast(null), 3200)
    }
  }

  return (
    <div className={s.page}>
      {toast && <div className={s.toast}>{toast}</div>}
      {edit && (
        <div className={s.backdrop} role="presentation" onClick={() => setEdit(null)}>
          <div
            className={s.modal}
            role="dialog"
            aria-label="Sửa lớp"
            onClick={ev => ev.stopPropagation()}
          >
            <h2 className={s.modalTitle}>Sửa lớp</h2>
            <label className={s.lbl}>Tên lớp</label>
            <input
              className={s.inputFull}
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <label className={s.lbl}>Ghi chú lớp</label>
            <textarea
              className={s.textareaFull}
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              rows={3}
              placeholder="Tùy chọn"
            />
            <div className={s.modalActions}>
              <button type="button" className={s.btnGhost} onClick={() => setEdit(null)}>
                Hủy
              </button>
              <button type="button" className={s.btnPrimary} onClick={() => void saveEdit()}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className={s.h1}>Lớp học</h1>
      <p className={s.lead}>Tạo lớp (tên + ghi chú tùy chọn), thêm học sinh, nhập/xuất CSV.</p>

      {canManageClass && (
        <form onSubmit={create} className={s.createBlock}>
          <div className={s.createRow}>
            <input
              className={s.input}
              placeholder="Tên lớp"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className={s.input}
              placeholder="Ghi chú lớp (tùy chọn)"
              value={classNote}
              onChange={e => setClassNote(e.target.value)}
            />
          </div>
          <button type="submit" className={s.btn}>
            Tạo lớp
          </button>
        </form>
      )}

      {loading ? (
        <div className={s.center}>
          <div className={s.spin} />
        </div>
      ) : list.length === 0 ? (
        <p className={s.empty}>Chưa có lớp nào.</p>
      ) : (
        <ul className={s.list}>
          {list.map(c => (
            <li key={c.id} className={s.itemRow}>
              <Link href={`/teacher/classes/${c.id}`} className={s.card}>
                <span className={s.cname}>{c.name}</span>
                <span className={s.meta}>
                  {c.note ? `${c.note} · ` : ''}
                  {c.student_count} học sinh
                </span>
                <span className={s.arrow}>→</span>
              </Link>
              {canManageClass ? (
                <div className={s.itemActions}>
                  <button
                    type="button"
                    className={s.iconBtn}
                    title="Sửa lớp"
                    aria-label="Sửa lớp"
                    onClick={() => openEdit(c)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={s.iconBtnDanger}
                    title="Xóa lớp"
                    aria-label="Xóa lớp"
                    onClick={() => void removeCls(c)}
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
