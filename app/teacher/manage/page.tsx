'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import s from './manage.module.css'

type Exam = { id:number; exam_code:string; topic:string; subject:string; grade:string; difficulty:string; allow_retake:boolean; created_at:string; result_count:number; avg_score:number|null }

export default function ManagePage() {
  const [exams,   setExams]   = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => { loadExams() }, [])

  async function loadExams() {
    setLoading(true)
    const res  = await fetch('/api/exams')
    const data = await res.json()
    setExams(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function deleteExam(id: number) {
    if (!confirm('Xóa đề này? Toàn bộ kết quả liên quan sẽ bị xóa.')) return
    await fetch('/api/exams', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    loadExams()
  }

  const filtered = exams.filter(e =>
    e.topic.toLowerCase().includes(search.toLowerCase()) ||
    e.exam_code.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase())
  )

  const diffLabel: Record<string,string> = { easy:'Dễ', medium:'TB', hard:'Khó', mixed:'Hỗn hợp' }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/teacher" className={s.back}>← Tạo đề mới</Link>
        <span className={s.navTitle}>Quản lý đề thi</span>
      </nav>
      <div className={s.container}>
        <div className={s.toolbar}>
          <input className={s.search} placeholder="🔍  Tìm theo tên, mã đề, môn học..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className={s.total}>{filtered.length} đề</span>
        </div>

        {loading ? (
          <div className={s.center}><div className={s.spin}/></div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>Chưa có đề thi nào. <Link href="/teacher" className={s.link}>Tạo ngay →</Link></div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Mã đề</th><th>Chủ đề</th><th>Môn / Lớp</th>
                  <th>Mức độ</th><th>Kết quả</th><th>Điểm TB</th>
                  <th>Làm lại</th><th>Ngày tạo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td><span className={s.code}>{e.exam_code}</span></td>
                    <td className={s.topic}>{e.topic}</td>
                    <td>{e.subject} · {e.grade}</td>
                    <td><span className={s.diffBadge}>{diffLabel[e.difficulty] ?? e.difficulty}</span></td>
                    <td>{e.result_count} bài</td>
                    <td>{e.avg_score != null ? `${e.avg_score}%` : '—'}</td>
                    <td>{e.allow_retake ? 'Nhiều lần' : '1 lần'}</td>
                    <td className={s.date}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className={s.actions}>
                        <Link href={`/teacher/stats/${e.id}`} className={s.btnView}>Kết quả</Link>
                        <button onClick={() => deleteExam(e.id)} className={s.btnDel}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
