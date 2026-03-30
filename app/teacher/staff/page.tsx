'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStaffMe } from '../useStaffMe'
import s from '../manage/manage.module.css'

type Row = {
  id: number
  username: string
  role: string
  display_name: string
  created_at: string
}

export default function StaffPage() {
  const router = useRouter()
  const me = useStaffMe()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [u, setU] = useState('')
  const [pw, setPw] = useState('')
  const [role, setRole] = useState<'teacher' | 'school_manager'>('teacher')
  const [dn, setDn] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (me === undefined) return
    if (me === null || me.role !== 'admin' || me.username !== 'adminer') {
      router.replace('/teacher/classes')
      return
    }
    ;(async () => {
      const res = await fetch('/api/staff', { credentials: 'include' })
      if (res.status === 401) {
        router.replace('/teacher/login?next=/teacher/staff')
        return
      }
      const d = await res.json()
      setRows(Array.isArray(d) ? d : [])
      setLoading(false)
    })()
  }, [me, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setSaving(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: u.trim(),
          password: pw,
          role,
          displayName: dn.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi')
      setRows(prev => [data as Row, ...prev])
      setU('')
      setPw('')
      setDn('')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setSaving(false)
    }
  }

  if (me === undefined || loading) {
    return (
      <div className={s.page}>
        <div className={s.center}>
          <div className={s.spin} />
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.dashTop}>
        <h1 className={s.h1}>Tạo tài khoản phụ</h1>
        <Link href="/teacher/classes" className={s.link}>
          ← Lớp học
        </Link>
      </div>
      <div className={s.container}>
        <p className={s.lead}>
          Tài khoản phụ chỉ để làm đề hoặc lớp — kiểu chân sai vặt, không nằm trong nhóm quản trị hệ thống.
        </p>

        <form onSubmit={onSubmit} className={s.filters} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <input
            className={s.search}
            placeholder="Tên đăng nhập"
            value={u}
            onChange={e => setU(e.target.value)}
            required
            autoComplete="off"
          />
          <input
            className={s.search}
            type="password"
            placeholder="Mật khẩu"
            value={pw}
            onChange={e => setPw(e.target.value)}
            required
            autoComplete="new-password"
          />
          <select className={s.select} value={role} onChange={e => setRole(e.target.value as 'teacher' | 'school_manager')}>
            <option value="teacher">Giáo viên</option>
            <option value="school_manager">Phụ trách lớp (không làm đề)</option>
          </select>
          <input
            className={s.search}
            placeholder="Tên hiển thị (tuỳ chọn)"
            value={dn}
            onChange={e => setDn(e.target.value)}
          />
          {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
          <button type="submit" className={s.btnCreate} disabled={saving}>
            {saving ? 'Đang tạo…' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className={s.tableWrap} style={{ marginTop: '2rem' }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Tên</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className={s.code}>{r.username}</td>
                  <td>
                    {r.role === 'school_manager'
                      ? 'Phụ trách lớp'
                      : r.role === 'admin'
                        ? 'Chủ hệ thống'
                        : 'Giáo viên'}
                  </td>
                  <td>{r.display_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
