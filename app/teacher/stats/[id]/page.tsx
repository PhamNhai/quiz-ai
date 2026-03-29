'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import s from './stats.module.css'

type Result = { id:number; student_name:string; score:number; total_questions:number; percentage:number; ai_comment:string; submitted_at:string }

function toCSV(rows: Result[]): string {
  const header = 'STT,Họ tên,Điểm,Tổng câu,Tỉ lệ (%),Nộp lúc,Nhận xét AI'
  const lines  = rows.map((r, i) =>
    `${i+1},"${r.student_name}",${r.score},${r.total_questions},${r.percentage},"${new Date(r.submitted_at).toLocaleString('vi-VN')}","${(r.ai_comment ?? '').replace(/"/g,'""')}"`
  )
  return [header, ...lines].join('\n')
}

export default function StatsPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/exams/${id}/results`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) {
          router.replace(`/teacher/login?next=${encodeURIComponent(`/teacher/stats/${id}`)}`)
          return null
        }
        return r.json()
      })
      .then(d => { if (d) setResults(Array.isArray(d) ? d : []) })
      .finally(() => setLoading(false))
  }, [id, router])

  function downloadCSV() {
    const csv  = toCSV(results)
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `ketqua-de${id}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const avg = results.length ? Math.round(results.reduce((s,r) => s + r.percentage, 0) / results.length) : 0
  const top = results[0]

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/teacher" className={s.back}>← Tổng quan</Link>
        <span className={s.navTitle}>Kết quả thi — Đề #{id}</span>
      </nav>
      <div className={s.container}>

        {/* Tổng quan */}
        {results.length > 0 && (
          <div className={s.statCards}>
            <div className={s.statCard}>
              <div className={s.statNum}>{results.length}</div>
              <div className={s.statLabel}>Học sinh</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statNum}>{avg}%</div>
              <div className={s.statLabel}>Điểm trung bình</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statNum}>{top?.percentage ?? 0}%</div>
              <div className={s.statLabel}>Điểm cao nhất</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statNum}>{results.filter(r => r.percentage >= 50).length}</div>
              <div className={s.statLabel}>Đạt (≥50%)</div>
            </div>
          </div>
        )}

        <div className={s.toolbar}>
          <h2 className={s.tableTitle}>Bảng xếp hạng</h2>
          {results.length > 0 && (
            <button onClick={downloadCSV} className={s.btnExport}>↓ Xuất CSV</button>
          )}
        </div>

        {loading ? (
          <div className={s.center}><div className={s.spin}/></div>
        ) : results.length === 0 ? (
          <div className={s.empty}>Chưa có học sinh nào nộp bài.</div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Xếp hạng</th><th>Họ và tên</th><th>Điểm</th>
                  <th>Tổng câu</th><th>Tỉ lệ</th><th>Thời gian nộp</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id} className={i < 3 ? s[`rank${i+1}`] : ''}>
                    <td className={s.rankCell}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className={s.nameCell}>{r.student_name}</td>
                    <td className={s.scoreCell}>{r.score}/{r.total_questions}</td>
                    <td>{r.total_questions}</td>
                    <td>
                      <div className={s.pctWrap}>
                        <div className={s.pctBar}>
                          <div className={s.pctFill} style={{
                            width: `${r.percentage}%`,
                            background: r.percentage >= 80 ? 'var(--success)' : r.percentage >= 50 ? 'var(--accent)' : 'var(--danger)'
                          }}/>
                        </div>
                        <span className={s.pctNum}>{r.percentage}%</span>
                      </div>
                    </td>
                    <td className={s.dateCell}>{new Date(r.submitted_at).toLocaleString('vi-VN')}</td>
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
