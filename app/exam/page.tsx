'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import s from './entry.module.css'

export default function ExamEntry() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function start() {
    if (!name.trim() || !code.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/exams/verify-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          password: password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể vào bài')
      sessionStorage.setItem(
        `exam_auth_${data.examId}`,
        JSON.stringify({
          studentName: data.studentName,
          studentId: data.studentId,
        })
      )
      router.push(`/exam/${data.examId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/" className={s.logo}>
          QuizAI
        </Link>
      </nav>
      <div className={s.center}>
        <div className={s.card}>
          <h1>Làm bài thi</h1>
          <p className={s.sub}>Nhập mã đề, họ tên và mật khẩu (nếu giáo viên gắn đề với lớp).</p>
          <div className={s.field}>
            <label>Mã đề thi</label>
            <input
              className={s.input}
              placeholder="VD: TOAN-HK1-2024"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && start()}
            />
          </div>
          <div className={s.field}>
            <label>Họ và tên</label>
            <input
              className={s.input}
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && start()}
            />
          </div>
          <div className={s.field}>
            <label>Mật khẩu học sinh</label>
            <input
              className={s.input}
              type="password"
              autoComplete="off"
              placeholder="Bắt buộc nếu đề chỉ dành cho lớp"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && start()}
            />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button onClick={start} disabled={!name.trim() || !code.trim() || loading} className={s.btn}>
            {loading ? 'Đang kiểm tra...' : 'Bắt đầu làm bài →'}
          </button>
        </div>
      </div>
    </div>
  )
}
