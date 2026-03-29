import sql, { type ExamRow } from '@/lib/db'
import type { StaffSession } from '@/lib/staff-auth'

/** Giáo viên chỉ thấy đề do mình tạo; admin thấy hết; quản lý trường không dùng đề. */
export function canAccessExamRow(session: StaffSession, createdBy: number | null): boolean {
  if (session.role === 'admin') return true
  if (session.role === 'school_manager') return false
  if (session.role === 'teacher') {
    if (createdBy == null) return false
    return createdBy === session.userId
  }
  return false
}

export async function getExamIfAllowed(
  session: StaffSession,
  examId: number
): Promise<ExamRow | null> {
  const rows = (await sql`SELECT * FROM exams WHERE id = ${examId}`) as ExamRow[]
  if (!rows.length) return null
  const e = rows[0]
  if (!canAccessExamRow(session, e.created_by ?? null)) return null
  return e
}
