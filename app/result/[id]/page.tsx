'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import s from './result.module.css'

type DetailedResult = {
  question: string; options: Record<string,string>
  correct: string; studentAnswer: string | null; isCorrect: boolean; explanation: string
}
type ResultData = {
  score: number; total: number; percentage: number
  aiComment: string; detailedResults: DetailedResult[]
  studentName?: string
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ResultData | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const cached = sessionStorage.getItem(`result_${id}`)
    if (cached) setData(JSON.parse(cached))
  }, [id])

  if (!data) return (
    <div className={s.center}>
      <p className={s.msg}>Không tìm thấy kết quả.</p>
      <Link href="/exam" className={s.link}>← Làm bài thi</Link>
    </div>
  )

  const { score, total, percentage, aiComment, detailedResults } = data
  const grade = percentage >= 85 ? 'Xuất sắc' : percentage >= 70 ? 'Khá' : percentage >= 50 ? 'Trung bình' : 'Cần cố gắng'
  const gradeColor = percentage >= 85 ? 'excellent' : percentage >= 70 ? 'good' : percentage >= 50 ? 'average' : 'poor'

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/" className={s.logo}>QuizAI</Link>
      </nav>

      <div className={s.container}>
        {/* Score card */}
        <div className={s.scoreCard}>
          <div className={`${s.scoreBig} ${s[gradeColor]}`}>{percentage}%</div>
          <div className={s.scoreDetail}>{score}/{total} câu đúng</div>
          <div className={`${s.gradeBadge} ${s[`badge_${gradeColor}`]}`}>{grade}</div>
        </div>

        {/* AI comment */}
        <div className={s.aiCard}>
          <div className={s.aiHeader}>
            <span className={s.aiIcon}>◉</span>
            <span className={s.aiLabel}>Nhận xét từ AI</span>
          </div>
          <p className={s.aiText}>{aiComment}</p>
        </div>

        {/* Toggle chi tiết */}
        <button onClick={() => setShowDetail(!showDetail)} className={s.btnToggle}>
          {showDetail ? 'Ẩn chi tiết' : 'Xem đáp án chi tiết'} {showDetail ? '↑' : '↓'}
        </button>

        {showDetail && (
          <div className={s.detailList}>
            {detailedResults.map((r, i) => (
              <div key={i} className={`${s.detailCard} ${r.isCorrect ? s.correct : s.wrong}`}>
                <div className={s.detailHeader}>
                  <span className={s.detailNum}>Câu {i + 1}</span>
                  <span className={`${s.detailBadge} ${r.isCorrect ? s.badgeCorrect : s.badgeWrong}`}>
                    {r.isCorrect ? '✓ Đúng' : '✗ Sai'}
                  </span>
                </div>
                <p className={s.detailQ}>{r.question}</p>
                <div className={s.detailOptions}>
                  {Object.entries(r.options).map(([k, v]) => (
                    <div key={k} className={`${s.detailOpt}
                      ${k === r.correct ? s.optCorrect : ''}
                      ${k === r.studentAnswer && !r.isCorrect ? s.optWrong : ''}
                    `}>
                      <span className={s.optK}>{k}</span> {v}
                      {k === r.correct && <span className={s.optTag}>✓ Đáp án đúng</span>}
                      {k === r.studentAnswer && !r.isCorrect && <span className={s.optTagWrong}>Bạn chọn</span>}
                    </div>
                  ))}
                </div>
                {r.explanation && (
                  <div className={s.explanation}>
                    <span className={s.expIcon}>💡</span> {r.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={s.footerActions}>
          <Link href="/exam" className={s.btnAgain}>Làm bài khác</Link>
        </div>
      </div>
    </div>
  )
}
