'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { TeacherResultDetailModal } from '@/components/TeacherResultDetailModal'
import { TeacherRowMenu } from '@/components/TeacherRowMenu'
import s from './exam-board.module.css'

type Row = {
  student_id: number
  display_name: string
  result_id: number | null
  score: number | null
  total_questions: number | null
  percentage: number | null
  submitted_at: string | null
}

type Exam = { id: number; exam_code: string; topic: string; subject: string; grade: string }

export default function ClassExamBoardPage() {
  const { id, examId } = useParams<{ id: string; examId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [className, setClassName] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [modal, setModal] = useState<{ resultId: number; studentId: number } | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/classes/${id}`, { credentials: 'include' }),
      fetch(`/api/classes/${id}/exams/${examId}`, { credentials: 'include' }),
    ])
      .then(async ([rClass, rBoard]) => {
        if (rClass.status === 401 || rBoard.status === 401) {
          router.replace(`/teacher/login?next=/teacher/classes/${id}/exams/${examId}`)
          return
        }
        if (rBoard.status === 403) {
          router.replace('/teacher/classes')
          return
        }
        const c = await rClass.json().catch(() => ({}))
        if (c.name) setClassName(c.name)
        const d = await rBoard.json()
        if (!rBoard.ok) {
          setExam(null)
          setRows([])
          return
        }
        setExam(d.exam)
        setRows(Array.isArray(d.students) ? d.students : [])
      })
      .finally(() => setLoading(false))
  }, [id, examId, router])

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.center}>
          <div className={s.spin} />
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className={s.page}>
        <Link href={`/teacher/classes/${id}`} className={s.back}>
          ← Lớp
        </Link>
        <p className={s.err}>Không tải được dữ liệu đề / lớp.</p>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href={`/teacher/classes/${id}`} className={s.back}>
          ← {className || 'Lớp'}
        </Link>
        <Link href={`/teacher/stats/${exam.id}`} className={s.statsLink}>
          Xem bảng xếp hạng đề
        </Link>
      </nav>
      <div className={s.head}>
        <span className={s.code}>{exam.exam_code}</span>
        <h1 className={s.h1}>{exam.topic}</h1>
        <p className={s.meta}>
          {exam.subject} · Khối {exam.grade} ·{' '}
          {rows.filter(r => r.result_id != null).length}/{rows.length} học sinh đã nộp
        </p>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Trạng thái</th>
              <th>Điểm</th>
              <th>Tỉ lệ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.student_id}>
                <td>
                  <Link href={`/teacher/students/${r.student_id}`} className={s.nameLink}>
                    {r.display_name}
                  </Link>
                </td>
                <td>
                  {r.result_id != null ? (
                    <span className={s.badgeOk}>Đã nộp</span>
                  ) : (
                    <span className={s.badgeNo}>Chưa làm</span>
                  )}
                </td>
                <td>
                  {r.result_id != null && r.score != null && r.total_questions != null
                    ? `${r.score}/${r.total_questions}`
                    : '—'}
                </td>
                <td>{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                <td className={s.tdAct}>
                  {r.result_id != null && exam && (
                    <TeacherRowMenu
                      items={[
                        {
                          label: 'Xem đề & đáp án',
                          onClick: () =>
                            setModal({ resultId: r.result_id!, studentId: r.student_id }),
                        },
                        {
                          label: 'Hồ sơ học sinh',
                          onClick: () => router.push(`/teacher/students/${r.student_id}`),
                        },
                      ]}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && exam && (
        <TeacherResultDetailModal
          key={`${modal.resultId}-${exam.id}`}
          open
          onClose={() => setModal(null)}
          studentId={modal.studentId}
          examId={exam.id}
          initialResultId={modal.resultId}
        />
      )}
    </div>
  )
}
