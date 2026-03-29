/**
 * @deprecated Dùng getStaffSession từ staff-auth. Giữ export để tương thích import cũ.
 */
export {
  TEACHER_SESSION_COOKIE,
  createStaffSessionToken as createSessionToken,
  getStaffSession,
  verifyStaffSessionToken as verifySessionToken,
} from './staff-auth'
import type { NextRequest } from 'next/server'
import { getStaffSession } from './staff-auth'

/** Cookie hợp lệ (mọi role nhân sự). */
export async function isTeacherRequest(req: NextRequest): Promise<boolean> {
  return (await getStaffSession(req)) != null
}

export function checkTeacherCredentials(username: string, password: string): boolean {
  const u = process.env.TEACHER_USERNAME ?? 'quizadmin'
  const p = process.env.TEACHER_PASSWORD ?? '12345678'
  return username === u && password === p
}
