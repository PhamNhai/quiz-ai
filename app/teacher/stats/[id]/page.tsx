'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { csvStringToUtf8Blob, excelSafeScoreText, toExcelCsv } from '@/lib/csv-excel'
import { TeacherResultDetailModal } from '@/components/TeacherResultDetailModal'
import { TeacherRowMenu } from '@/components/TeacherRowMenu'
import s from './stats.module.css'

type Result = {
  id: number
  student_name: string
  student_id: number | null
  score: number
  total_questions: number
  percentage: number
  ai_comment: string
  submitted_at: string
  attempt_count?: number
}

function buildResultsCsv(rows: Result[]): string {
  const header = ['STT', 'Họ tên', 'Điểm', 'Tỉ lệ (%)', 'Lần làm', 'Nộp lúc']
  const data = rows.map((r, i) => [
    i + 1,
    r.student_name,
    excelSafeScoreText(r.score, r.total_questions),
    r.percentage,
    typeof r.attempt_count === 'number' ? r.attempt_count : '',
    new Date(r.submitted_at).toLocaleString('vi-VN'),
  ])
  return toExcelCsv(header, data)
}

export default function StatsPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ resultId: number; studentId: number | null } | null>(null)
  const [examCode, setExamCode] = useState('')

  useEffect(() => {
    fetch(`/api/exams/${id}/results`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) {
          router.replace(`/teacher/login?next=${encodeURIComponent(`/teacher/stats/${id}`)}`)
          return null
        }
        if (r.status === 403) {
          router.replace('/teacher/classes')
          return null
        }
        return r.json()
      })
      .then(d => {
        if (d) setResults(Array.isArray(d) ? d : [])
      })
      .finally(() => setLoading(false))
    fetch(`/api/teacher/exams/${id}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.examCode) setExamCode(String(d.examCode))
      })
      .catch(() => {})
  }, [id, router])

  function downloadCSV() {
    const csv = buildResultsCsv(results)
    const blob = csvStringToUtf8Blob(csv)
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
                  <th>Xếp hạng</th>
                  <th>Họ và tên</th>
                  <th>Kết quả</th>
                  <th>Tỉ lệ</th>
                  <th>Lần làm</th>
                  <th>Nộp lúc</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id} className={i < 3 ? s[`rank${i+1}`] : ''}>
                    <td className={s.rankCell}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className={s.nameCell}>
                      {r.student_id != null ? (
                        <Link href={`/teacher/students/${r.student_id}`} className={s.nameLink}>
                          {r.student_name}
                        </Link>
                      ) : (
                        r.student_name
                      )}
                    </td>
                    <td className={s.scoreCell}>{r.score}/{r.total_questions}</td>
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
                    <td className={s.attemptCell}>
                      {typeof r.attempt_count === 'number' ? `${r.attempt_count} lần` : '—'}
                    </td>
                    <td className={s.dateCell}>{new Date(r.submitted_at).toLocaleString('vi-VN')}</td>
                    <td className={s.actions}>
                      <TeacherRowMenu
                        items={[
                          {
                            label: 'Xem đề & đáp án',
                            onClick: () =>
                              setModal({ resultId: r.id, studentId: r.student_id ?? null }),
                          },
                          ...(r.student_id != null
                            ? [
                                {
                                  label: 'Hồ sơ học sinh',
                                  onClick: () => router.push(`/teacher/students/${r.student_id}`),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <TeacherResultDetailModal
          key={`${modal.resultId}-${id}`}
          open
          onClose={() => setModal(null)}
          studentId={modal.studentId ?? undefined}
          examId={Number(id)}
          initialResultId={modal.resultId}
        />
      )}
    </div>
  )
}
