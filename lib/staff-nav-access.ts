/** Session staff tối thiểu để suy quyền menu. */
export type StaffMeLike = {
  role: 'admin' | 'school_manager' | 'teacher'
  username: string
}

/** Đề thi: tổng quan, tạo đề… — chỉ admin + giáo viên (không phải quản lý trường). */
export function canAccessTeacherExamArea(me: StaffMeLike | null | undefined): boolean {
  if (!me) return false
  return me.role === 'admin' || me.role === 'teacher'
}

/** Trang /teacher/staff — chỉ tài khoản adminer. */
export function canAccessStaffManagementPage(me: StaffMeLike | null | undefined): boolean {
  if (!me) return false
  return me.role === 'admin' && me.username === 'adminer'
}

/** Danh sách lớp — mọi vai trò staff. */
export function canAccessClassesList(me: StaffMeLike | null | undefined): boolean {
  if (!me) return false
  return me.role === 'admin' || me.role === 'teacher' || me.role === 'school_manager'
}
