'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStaffMe } from './useStaffMe'
import s from './teacher-shell.module.css'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const me = useStaffMe()
  const noShell =
    pathname.startsWith('/teacher/login') ||
    pathname.startsWith('/teacher/review') ||
    pathname.startsWith('/teacher/success') ||
    pathname.startsWith('/teacher/stats')
  if (noShell) return <>{children}</>

  const dash = pathname === '/teacher'
  const create = pathname.startsWith('/teacher/create')
  const classes = pathname.startsWith('/teacher/classes')
  const staff = pathname.startsWith('/teacher/staff')

  const showExamNav = me?.role !== 'school_manager'
  const showStaffNav = me?.role === 'admin'
  const roleLabel =
    me?.role === 'admin'
      ? 'Quản trị'
      : me?.role === 'school_manager'
        ? 'Quản lý trường'
        : me?.role === 'teacher'
          ? 'Giáo viên'
          : ''

  return (
    <div className={s.shell}>
      <aside className={s.aside}>
        <Link href={showExamNav ? '/teacher' : '/teacher/classes'} className={s.brand}>
          QuizAI
        </Link>
        {roleLabel && <p className={s.roleBadge}>{roleLabel}</p>}
        <nav className={s.nav}>
          {showExamNav && (
            <div className={s.group}>
              <div className={s.groupLabel}>Đề thi</div>
              <div className={s.subNav}>
                <Link href="/teacher" className={dash ? s.active : ''}>
                  Tổng quan
                </Link>
                <Link href="/teacher/create" className={create ? s.active : ''}>
                  Tạo đề mới
                </Link>
              </div>
            </div>
          )}

          <div className={s.group}>
            <div className={s.groupLabel}>Lớp & học sinh</div>
            <div className={s.subNav}>
              <Link href="/teacher/classes" className={classes ? s.active : ''}>
                Danh sách lớp
              </Link>
            </div>
          </div>

          {showStaffNav && (
            <div className={s.group}>
              <div className={s.groupLabel}>Quản trị</div>
              <div className={s.subNav}>
                <Link href="/teacher/staff" className={staff ? s.active : ''}>
                  Tài khoản nhân sự
                </Link>
              </div>
            </div>
          )}
        </nav>
        <div className={s.footer}>
          <Link href="/">← Trang chủ</Link>
        </div>
      </aside>
      <main className={s.main}>{children}</main>
    </div>
  )
}
