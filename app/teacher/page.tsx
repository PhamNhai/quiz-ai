'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GRADES_ALL, SUBJECTS_ALL, getSubtopics } from '@/lib/curriculum'
import s from './teacher.module.css'

const COUNTS = [10, 20, 30]
const DIFFS  = [
  { v:'easy',   l:'Dễ',       d:'Nhận biết' },
  { v:'medium', l:'Trung bình',d:'Thông hiểu' },
  { v:'hard',   l:'Khó',      d:'Vận dụng' },
  { v:'mixed',  l:'Hỗn hợp',  d:'40/40/20%' },
]

export default function TeacherPage() {
  const router = useRouter()
  const [subject,     setSubject]     = useState('')
  const [grade,       setGrade]       = useState('')
  const [topic,       setTopic]       = useState('')
  const [subtopic,    setSubtopic]    = useState('')
  const [count,       setCount]       = useState<number|''>('')
  const [customCount, setCustomCount] = useState('')
  const [difficulty,  setDifficulty]  = useState('mixed')
  const [extra,       setExtra]       = useState('')
  const [examCode,    setExamCode]    = useState('')
  const [allowRetake, setAllowRetake] = useState(true)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const finalCount = count || (customCount ? parseInt(customCount) : 0)
  const canSubmit  = subject && grade && topic.trim() && finalCount >= 5
  const suggestions = getSubtopics(subject, grade)

  async function handleSubmit() {
    if (!canSubmit || loading) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, topic, subtopic, count: finalCount, difficulty, extra, examCode, allowRetake })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Chuyển sang màn review đáp án
      sessionStorage.setItem('review_draft', JSON.stringify(data))
      router.push('/teacher/review')
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra, thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/" className={s.back}>← Trang chủ</Link>
        <span className={s.navTitle}>Tạo đề thi</span>
        <Link href="/teacher/manage" className={s.navLink}>Quản lý đề</Link>
      </nav>
      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1>Thiết lập đề thi</h1>
          <p>Chọn thông số bên dưới — AI soạn câu hỏi, bạn duyệt trước khi lưu.</p>
        </div>

        {/* MÔN HỌC */}
        <div className={s.section}>
          <label className={s.label}>Môn học <span className={s.req}>*</span></label>
          <div className={s.chips}>
            {SUBJECTS_ALL.map(sub => (
              <button key={sub} onClick={() => { setSubject(sub); setSubtopic('') }}
                className={`${s.chip} ${subject===sub ? s.chipOn : ''}`}>{sub}</button>
            ))}
          </div>
        </div>

        {/* KHỐI LỚP */}
        <div className={s.section}>
          <label className={s.label}>Khối lớp <span className={s.req}>*</span></label>
          <div className={s.chips}>
            {GRADES_ALL.map(g => (
              <button key={g} onClick={() => { setGrade(g); setSubtopic('') }}
                className={`${s.chip} ${grade===g ? s.chipOn : ''}`}>{g}</button>
            ))}
          </div>
        </div>

        {/* CHỦ ĐỀ + CHUYÊN ĐỀ */}
        <div className={s.section}>
          <label className={s.label}>Chủ đề / Bài học <span className={s.req}>*</span></label>
          <input className={s.input} placeholder="Nhập tên chủ đề hoặc chọn gợi ý bên dưới..."
            value={topic} onChange={e => setTopic(e.target.value)} />
          {suggestions.length > 0 && (
            <div className={s.subtopicBlock}>
              <span className={s.subtopicHint}>
                Chuyên đề CT 2018 {grade && subject ? `— ${subject} ${grade}:` : ':'}
              </span>
              <div className={s.chips}>
                {suggestions.map(st => (
                  <button key={st}
                    onClick={() => { setSubtopic(st); setTopic(st) }}
                    className={`${s.chipSm} ${subtopic===st ? s.chipSmOn : ''}`}>{st}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SỐ CÂU */}
        <div className={s.section}>
          <label className={s.label}>Số câu hỏi <span className={s.req}>*</span></label>
          <div className={s.countRow}>
            {COUNTS.map(n => (
              <button key={n} onClick={() => { setCount(n); setCustomCount('') }}
                className={`${s.countChip} ${count===n ? s.chipOn : ''}`}>{n} câu</button>
            ))}
            <input type="number" min={5} max={50} placeholder="Tùy ý (5–50)"
              className={s.inputSm} value={customCount}
              onChange={e => { setCustomCount(e.target.value); setCount('') }} />
          </div>
        </div>

        {/* MỨC ĐỘ */}
        <div className={s.section}>
          <label className={s.label}>Mức độ</label>
          <div className={s.diffGrid}>
            {DIFFS.map(d => (
              <button key={d.v} onClick={() => setDifficulty(d.v)}
                className={`${s.diffCard} ${difficulty===d.v ? s.diffOn : ''}`}>
                <span className={s.diffLabel}>{d.l}</span>
                <span className={s.diffDesc}>{d.d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MÃ ĐỀ + CÀI ĐẶT */}
        <div className={s.section}>
          <div className={s.row2col}>
            <div>
              <label className={s.label}>Mã đề thi <span className={s.opt}>(tùy chọn)</span></label>
              <input className={s.input} placeholder="VD: TOAN-HK1-2024 (tự động tạo nếu bỏ trống)"
                value={examCode} onChange={e => setExamCode(e.target.value.toUpperCase())} />
              <p className={s.fieldHint}>Nếu trùng, hệ thống tự thêm ký tự phân biệt.</p>
            </div>
            <div>
              <label className={s.label}>Cài đặt làm bài</label>
              <div className={s.toggleRow}>
                <button onClick={() => setAllowRetake(true)}
                  className={`${s.toggleBtn} ${allowRetake ? s.toggleOn : ''}`}>
                  Làm nhiều lần
                </button>
                <button onClick={() => setAllowRetake(false)}
                  className={`${s.toggleBtn} ${!allowRetake ? s.toggleOn : ''}`}>
                  Chỉ làm 1 lần
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* YÊU CẦU THÊM */}
        <div className={s.section}>
          <label className={s.label}>Yêu cầu thêm <span className={s.opt}>(tùy chọn)</span></label>
          <textarea className={s.textarea} rows={3}
            placeholder="VD: Tập trung vào phát âm, thêm tình huống thực tế, tránh câu hỏi quá khó..."
            value={extra} onChange={e => setExtra(e.target.value)} />
        </div>

        {error && <div className={s.error}>{error}</div>}

        <button onClick={handleSubmit} disabled={!canSubmit||loading} className={s.btnCreate}>
          {loading ? <><span className={s.spin}/> Đang tạo đề... (15–30 giây)</> : '✦  Tạo đề với AI →'}
        </button>
        {!canSubmit && <p className={s.hint}>Chọn Môn học, Khối lớp, nhập Chủ đề và Số câu (≥ 5).</p>}
      </div>
    </div>
  )
}
