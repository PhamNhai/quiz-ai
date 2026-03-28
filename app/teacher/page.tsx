'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import s from './teacher.module.css'

const SUBJECTS = ['Tiếng Anh','Toán','Vật lý','Hóa học','Sinh học','Ngữ văn','Lịch sử','Địa lý','GDCD','Tin học','Thể dục','Âm nhạc']
const GRADES   = ['Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12']
const COUNTS   = [10, 20, 30]
const DIFFS    = [
  { v: 'easy',   l: 'Dễ',       d: 'Nhận biết' },
  { v: 'medium', l: 'Trung bình', d: 'Thông hiểu' },
  { v: 'hard',   l: 'Khó',      d: 'Vận dụng' },
  { v: 'mixed',  l: 'Hỗn hợp',  d: '40/40/20%' },
]
const SUBTOPICS: Record<string, string[]> = {
  'Tiếng Anh': ['Thì hiện tại đơn','Thì quá khứ đơn','Thì tương lai','Câu bị động','Mệnh đề quan hệ','Từ vựng theo chủ đề','Đọc hiểu','Phát âm'],
  'Toán':      ['Đại số','Hình học phẳng','Hình học không gian','Xác suất','Giải tích','Lượng giác','Tổ hợp - Xác suất'],
  'Vật lý':    ['Cơ học','Nhiệt học','Điện học','Quang học','Vật lý hạt nhân','Dao động và sóng'],
  'Hóa học':   ['Hóa vô cơ','Hóa hữu cơ','Điện hóa','Tốc độ phản ứng','Dung dịch - Axit - Bazơ'],
  'Sinh học':  ['Tế bào học','Di truyền học','Sinh thái học','Tiến hóa','Giải phẫu người'],
  'Ngữ văn':   ['Đọc hiểu văn bản','Tiếng Việt','Nghị luận xã hội','Văn học trung đại','Văn học hiện đại'],
  'Lịch sử':   ['Lịch sử Việt Nam','Lịch sử thế giới cổ đại','Lịch sử thế giới hiện đại','Lịch sử chiến tranh'],
  'Địa lý':    ['Địa lý tự nhiên','Địa lý dân cư','Địa lý kinh tế','Địa lý Việt Nam'],
  'Tin học':   ['Lập trình cơ bản','Cấu trúc dữ liệu','Mạng máy tính','Hệ điều hành','Cơ sở dữ liệu'],
}

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
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const finalCount = count || (customCount ? parseInt(customCount) : 0)
  const canSubmit  = subject && grade && topic.trim() && finalCount >= 5

  async function handleSubmit() {
    if (!canSubmit || loading) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, topic, subtopic, count: finalCount, difficulty, extra })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/teacher/success?id=${data.examId}&count=${data.questionCount}`)
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
      </nav>

      <div className={s.container}>
        <div className={s.pageHeader}>
          <h1>Thiết lập đề thi</h1>
          <p>Chọn thông số bên dưới — AI sẽ soạn câu hỏi ngay lập tức.</p>
        </div>

        {/* MÔN HỌC */}
        <div className={s.section}>
          <label className={s.label}>Môn học <span className={s.req}>*</span></label>
          <div className={s.chips}>
            {SUBJECTS.map(sub => (
              <button key={sub}
                onClick={() => { setSubject(sub); setSubtopic('') }}
                className={`${s.chip} ${subject === sub ? s.chipOn : ''}`}>
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* KHỐI LỚP */}
        <div className={s.section}>
          <label className={s.label}>Khối lớp <span className={s.req}>*</span></label>
          <div className={s.chips}>
            {GRADES.map(g => (
              <button key={g}
                onClick={() => setGrade(g)}
                className={`${s.chip} ${grade === g ? s.chipOn : ''}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* CHỦ ĐỀ */}
        <div className={s.section}>
          <label className={s.label}>Chủ đề / Bài học <span className={s.req}>*</span></label>
          <input
            className={s.input}
            placeholder="VD: Thì hiện tại hoàn thành, Phương trình bậc hai..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          {subject && SUBTOPICS[subject] && (
            <div className={s.subtopicBlock}>
              <span className={s.subtopicHint}>Chuyên đề gợi ý:</span>
              <div className={s.chips}>
                {SUBTOPICS[subject].map(st => (
                  <button key={st}
                    onClick={() => { setSubtopic(st); if (!topic) setTopic(st) }}
                    className={`${s.chipSm} ${subtopic === st ? s.chipSmOn : ''}`}>
                    {st}
                  </button>
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
              <button key={n}
                onClick={() => { setCount(n); setCustomCount('') }}
                className={`${s.countChip} ${count === n ? s.chipOn : ''}`}>
                {n} câu
              </button>
            ))}
            <input
              type="number" min={5} max={50}
              placeholder="Tùy ý (5–50)"
              className={s.inputSm}
              value={customCount}
              onChange={e => { setCustomCount(e.target.value); setCount('') }}
            />
          </div>
        </div>

        {/* MỨC ĐỘ */}
        <div className={s.section}>
          <label className={s.label}>Mức độ</label>
          <div className={s.diffGrid}>
            {DIFFS.map(d => (
              <button key={d.v}
                onClick={() => setDifficulty(d.v)}
                className={`${s.diffCard} ${difficulty === d.v ? s.diffOn : ''}`}>
                <span className={s.diffLabel}>{d.l}</span>
                <span className={s.diffDesc}>{d.d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* YÊU CẦU THÊM */}
        <div className={s.section}>
          <label className={s.label}>Yêu cầu thêm <span className={s.opt}>(tùy chọn)</span></label>
          <textarea
            className={s.textarea} rows={3}
            placeholder="VD: Tập trung phát âm, tránh câu hỏi văn hóa nước ngoài, thêm tình huống thực tế..."
            value={extra}
            onChange={e => setExtra(e.target.value)}
          />
        </div>

        {error && <div className={s.error}>{error}</div>}

        <button onClick={handleSubmit} disabled={!canSubmit || loading} className={s.btnCreate}>
          {loading
            ? <><span className={s.spin}/> Đang tạo đề... (15-30 giây)</>
            : '✦  Tạo đề thi với AI'}
        </button>
        {!canSubmit && <p className={s.hint}>Chọn Môn học, Khối lớp, nhập Chủ đề và Số câu (≥ 5).</p>}
      </div>
    </div>
  )
}
