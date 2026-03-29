'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import s from './login.module.css'

function Form() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/teacher'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại')
      router.replace(next.startsWith('/teacher') ? next : '/teacher')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <h1 className={s.logo}>QuizAI</h1>
        <p className={s.sub}>Đăng nhập khu vực giáo viên</p>
        <form onSubmit={onSubmit}>
          <div className={s.field}>
            <label className={s.label}>Tài khoản</label>
            <input
              className={s.input}
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Mật khẩu</label>
            <input
              className={s.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={s.err}>{error}</p>}
          <button type="submit" className={s.btn} disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
        <p className={s.hint}>Chỉ dành cho giáo viên nội bộ — không chia sẻ tài khoản.</p>
        <Link href="/" className={s.back}>← Về trang chủ</Link>
      </div>
    </div>
  )
}

export default function TeacherLoginPage() {
  return (
    <Suspense
      fallback={
        <div className={s.page}>
          <div className={s.card}>
            <p className={s.sub}>Đang tải…</p>
          </div>
        </div>
      }
    >
      <Form />
    </Suspense>
  )
}
