'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useState, useEffect } from 'react'
import QRCode from 'qrcode'
import s from './success.module.css'

function Content() {
  const params  = useSearchParams()
  const examId  = params.get('id')
  const examCode= params.get('code') ?? examId
  const count   = params.get('count')
  const [copied, setCopied] = useState(false)
  const [qrUrl,  setQrUrl]  = useState('')

  const examUrl = typeof window !== 'undefined' ? `${window.location.origin}/exam/${examId}` : `/exam/${examId}`

  useEffect(() => {
    QRCode.toDataURL(examUrl, { width: 200, margin: 1 }).then(setQrUrl)
  }, [examUrl])

  function copy() {
    navigator.clipboard.writeText(examUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.iconWrap}><span className={s.icon}>✦</span></div>
        <h1 className={s.title}>Đề thi đã sẵn sàng!</h1>
        <p className={s.sub}>Tạo thành công <strong>{count} câu</strong>. Chia sẻ link hoặc QR cho học sinh.</p>

        <div className={s.codeBadge}>Mã đề: <strong>{examCode}</strong></div>

        <div className={s.linkBox}>
          <span className={s.linkText}>{examUrl}</span>
          <button onClick={copy} className={`${s.copyBtn} ${copied ? s.copied : ''}`}>
            {copied ? '✓ Đã chép' : 'Sao chép'}
          </button>
        </div>

        {qrUrl && (
          <div className={s.qrWrap}>
            <p className={s.qrLabel}>QR Code — học sinh quét để vào bài</p>
            <img src={qrUrl} alt="QR Code" className={s.qrImg} />
            <a href={qrUrl} download={`QR-${examCode}.png`} className={s.qrDownload}>Tải QR về máy</a>
          </div>
        )}

        <div className={s.actions}>
          <Link href={`/exam/${examId}`} className={s.btnPreview} target="_blank">Xem trước bài thi →</Link>
          <Link href={`/teacher/stats/${examId}`} className={s.btnStats}>Xem kết quả</Link>
          <Link href="/teacher" className={s.btnNew}>Tạo đề mới</Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense><Content /></Suspense>
}
