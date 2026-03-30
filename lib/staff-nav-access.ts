/** Session đăng nhập khu giáo viên (mọi vai trò). */
export type StaffMeLike = {
  role: 'admin' | 'school_manager' | 'teacher'
  username: string
}

/** Đề thi: tổng quan, tạo đề… — chỉ admin + giáo viên (không phải quản lý trường). */
export function canAccessTeacherExamArea(me: StaffMeLike | null | undefined): boolean {
  if (!me) return false
  return me.role === 'admin' || me.role === 'teacher'
}

/** Trang tạo tài khoản phụ — chỉ adminer. Giáo viên / phụ lớp không vào được. */
export function canAccessStaffManagementPage(me: StaffMeLike | null | undefined): boolean {
  if (!me) return false
  if (me.role === 'teacher' || me.role === 'school_manager') return false
  return me.role === 'admin' && me.username === 'adminer'
}

/** Nhãn vai trò: tài khoản thường = giúp việc (đề / lớp), không gọi là quản trị. */
export function staffRoleSubtitle(me: StaffMeLike): string {
  switch (me.role) {
    case 'teacher':
      return 'Giáo viên'
    case 'school_manager':
      return 'Phụ trách lớp'
    case 'admin':
      return me.username === 'adminer' ? 'Chủ hệ thống' : 'Admin'
    default:
      return ''
  }
}

/** Danh sách lớp — giáo viên, phụ lớp, chủ hệ thống. */
export function canAccessClassesList(me: StaffMeLike | null | undefined): boolean {
  if (!me) return false
  return me.role === 'admin' || me.role === 'teacher' || me.role === 'school_manager'
}
