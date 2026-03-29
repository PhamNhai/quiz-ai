'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import s from './entry.module.css'

export default function ExamEntry() {
  const router = useRouter()
  const [name,    setName]    = useState('')
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function start() {
    if (!name.trim() || !code.trim() || loading) return
    setLoading(true); setError('')
    try {
      // Tìm examId theo mã đề
      const res  = await fetch(`/api/exams/by-code?code=${encodeURIComponent(code.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/exam/${data.examId}?name=${encodeURIComponent(name.trim())}`)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}><Link href="/" className={s.logo}>QuizAI</Link></nav>
      <div className={s.center}>
        <div className={s.card}>
          <h1>Làm bài thi</h1>
          <p className={s.sub}>Nhập thông tin để bắt đầu.</p>
          <div className={s.field}>
            <label>Họ và tên</label>
            <input className={s.input} placeholder="Nguyễn Văn A" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter' && start()} />
          </div>
          <div className={s.field}>
            <label>Mã đề thi</label>
            <input className={s.input} placeholder="VD: TOAN-HK1-2024" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key==='Enter' && start()} />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button onClick={start} disabled={!name.trim()||!code.trim()||loading} className={s.btn}>
            {loading ? 'Đang tải...' : 'Bắt đầu làm bài →'}
          </button>
        </div>
      </div>
    </div>
  )
}
