'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import s from './classes.module.css'

type Cls = { id: number; name: string; student_count: number; created_at: string }

export default function ClassesPage() {
  const router = useRouter()
  const [list, setList] = useState<Cls[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

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
      body: JSON.stringify({ name: n }),
    })
    if (res.ok) {
      setName('')
      load()
    }
  }

  return (
    <div className={s.page}>
      <h1 className={s.h1}>Lớp học</h1>
      <p className={s.lead}>Tạo lớp, thêm học sinh (tên + mật khẩu), nhập/xuất CSV.</p>

      <form onSubmit={create} className={s.createRow}>
        <input
          className={s.input}
          placeholder="Tên lớp mới"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button type="submit" className={s.btn}>
          Tạo lớp
        </button>
      </form>

      {loading ? (
        <div className={s.center}>
          <div className={s.spin} />
        </div>
      ) : list.length === 0 ? (
        <p className={s.empty}>Chưa có lớp nào.</p>
      ) : (
        <ul className={s.list}>
          {list.map(c => (
            <li key={c.id}>
              <Link href={`/teacher/classes/${c.id}`} className={s.card}>
                <span className={s.cname}>{c.name}</span>
                <span className={s.meta}>{c.student_count} học sinh</span>
                <span className={s.arrow}>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
