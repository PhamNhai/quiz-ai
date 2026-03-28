'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import s from './entry.module.css'

export default function ExamEntry() {
  const router = useRouter()
  const [name,    setName]    = useState('')
  const [examId,  setExamId]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function start() {
    if (!name.trim() || !examId.trim() || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/exams/${examId.trim()}`)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      router.push(`/exam/${examId.trim()}?name=${encodeURIComponent(name.trim())}`)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}><Link href="/" className={s.logo}>QuizAI</Link></nav>
      <div className={s.center}>
        <div className={s.card}>
          <h1 className={s.title}>Làm bài thi</h1>
          <p className={s.sub}>Nhập thông tin của bạn để bắt đầu.</p>
          <div className={s.field}>
            <label>Họ và tên</label>
            <input className={s.input} placeholder="Nguyễn Văn A" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter' && start()} />
          </div>
          <div className={s.field}>
            <label>Mã đề thi</label>
            <input className={s.input} placeholder="VD: 15" value={examId}
              onChange={e => setExamId(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key==='Enter' && start()} />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button onClick={start} disabled={!name.trim()||!examId.trim()||loading} className={s.btn}>
            {loading ? 'Đang tải...' : 'Bắt đầu làm bài →'}
          </button>
        </div>
      </div>
    </div>
  )
}
