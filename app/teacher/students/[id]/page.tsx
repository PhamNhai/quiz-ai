'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStaffMe } from '../../useStaffMe'
import { TeacherResultDetailModal } from '@/components/TeacherResultDetailModal'
import { TeacherRowMenu } from '@/components/TeacherRowMenu'
import s from './student.module.css'

type Attempt = {
  id: number
  exam_id: number
  exam_code: string
  topic: string
  subject: string
  grade: string
  score: number
  total_questions: number
  percentage: number
  submitted_at: string
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const me = useStaffMe()
  const hideExamUi = me?.role === 'school_manager'
  const backHref = hideExamUi ? '/teacher/classes' : '/teacher'
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<{
    id: number
    displayName: string
    classId: number
    className: string
  } | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [modal, setModal] = useState<{ resultId: number; examId: number } | null>(null)

  useEffect(() => {
    fetch(`/api/students/${id}/results`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) {
          router.replace(`/teacher/login?next=${encodeURIComponent(`/teacher/students/${id}`)}`)
          return null
        }
        return r.json()
      })
      .then(d => {
        if (!d || d.error) {
          setStudent(null)
          return
        }
        setStudent(d.student)
        setAttempts(Array.isArray(d.attempts) ? d.attempts : [])
      })
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.center}>
          <div className={s.spin} />
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className={s.page}>
        <nav className={s.nav}>
          <Link href="/teacher" className={s.back}>
            ← Tổng quan
          </Link>
        </nav>
        <div className={s.container}>
          <p className={s.empty}>Không tìm thấy học sinh.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href={backHref} className={s.back}>
          {hideExamUi ? '← Lớp học' : '← Tổng quan'}
        </Link>
        <span className={s.navTitle}>Học sinh</span>
      </nav>
      <div className={s.container}>
        <div className={s.head}>
          <h1 className={s.h1}>{student.displayName}</h1>
          <p className={s.meta}>
            Lớp:{' '}
            <Link href={`/teacher/classes/${student.classId}`} className={s.classLink}>
              {student.className}
            </Link>
          </p>
        </div>

        {!hideExamUi && (
          <>
            <h2 className={s.h2}>Các đề đã làm</h2>
            {attempts.length === 0 ? (
              <p className={s.empty}>Chưa có bài nộp nào.</p>
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Mã đề</th>
                      <th>Chủ đề</th>
                      <th>Môn / Lớp</th>
                      <th>Điểm</th>
                      <th>Tỉ lệ</th>
                      <th>Nộp lúc</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(a => (
                      <tr key={a.id}>
                        <td>
                          <span className={s.code}>{a.exam_code}</span>
                        </td>
                        <td>{a.topic}</td>
                        <td>
                          {a.subject} · {a.grade}
                        </td>
                        <td>
                          {a.score}/{a.total_questions}
                        </td>
                        <td>{a.percentage}%</td>
                        <td className={s.date}>
                          {new Date(a.submitted_at).toLocaleString('vi-VN')}
                        </td>
                        <td className={s.actions}>
                          <TeacherRowMenu
                            items={[
                              {
                                label: 'Xem đề & đáp án',
                                onClick: () => setModal({ resultId: a.id, examId: a.exam_id }),
                              },
                              {
                                label: 'Bảng xếp hạng đề',
                                onClick: () => router.push(`/teacher/stats/${a.exam_id}`),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {modal && student && !hideExamUi && (
        <TeacherResultDetailModal
          key={`${modal.resultId}-${modal.examId}`}
          open
          onClose={() => setModal(null)}
          studentId={student.id}
          examId={modal.examId}
          initialResultId={modal.resultId}
        />
      )}
    </div>
  )
}
