'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import s from './success.module.css'

function Content() {
  const params  = useSearchParams()
  const examId  = params.get('id')
  const count   = params.get('count')
  const [copied, setCopied] = useState(false)
  const examUrl = typeof window !== 'undefined' ? `${window.location.origin}/exam/${examId}` : `/exam/${examId}`

  function copy() {
    navigator.clipboard.writeText(examUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.iconWrap}><span className={s.icon}>✦</span></div>
        <h1>Đề thi đã sẵn sàng!</h1>
        <p className={s.sub}>Tạo thành công <strong>{count} câu hỏi</strong>. Chia sẻ link bên dưới cho học sinh.</p>
        <div className={s.idBadge}>Mã đề: <strong>#{examId}</strong></div>
        <div className={s.linkBox}>
          <span className={s.linkText}>{examUrl}</span>
          <button onClick={copy} className={`${s.copyBtn} ${copied ? s.copied : ''}`}>
            {copied ? '✓ Đã chép' : 'Sao chép'}
          </button>
        </div>
        <div className={s.actions}>
          <Link href={`/exam/${examId}`} className={s.btnPreview} target="_blank">Xem trước bài thi →</Link>
          <Link href="/teacher" className={s.btnNew}>Tạo đề mới</Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense><Content /></Suspense>
}
