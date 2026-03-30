'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  canAccessClassesList,
  canAccessStaffManagementPage,
  canAccessTeacherExamArea,
  staffRoleSubtitle,
} from '@/lib/staff-nav-access'
import { useStaffMe } from './useStaffMe'
import s from './teacher-shell.module.css'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
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

  const navReady = me !== undefined
  const showExamNav = navReady && me != null && canAccessTeacherExamArea(me)
  const showClassNav = navReady && me != null && canAccessClassesList(me)
  const showStaffMgmtLink = navReady && me != null && canAccessStaffManagementPage(me)

  const brandHref =
    navReady && me != null && !canAccessTeacherExamArea(me) ? '/teacher/classes' : '/teacher'

  const userLabel =
    me &&
    (me.displayName && me.displayName.trim() ? me.displayName.trim() : me.username)

  const userInitials = (() => {
    if (!userLabel) return '?'
    const parts = userLabel.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
    }
    return userLabel.slice(0, 2).toUpperCase()
  })()

  async function logout() {
    await fetch('/api/auth/teacher', { method: 'DELETE', credentials: 'include' })
    router.replace('/teacher/login')
    router.refresh()
  }

  return (
    <div className={s.shell}>
      <aside className={s.aside}>
        <Link href={brandHref} className={s.brand}>
          QuizAI
        </Link>
        {userLabel ? (
          <div className={s.userCard}>
            <div className={s.userAvatar} aria-hidden>
              {userInitials}
            </div>
            <div className={s.userMeta}>
              <span className={s.userName}>{userLabel}</span>
              {me ? (
                <span className={s.userRole}>{staffRoleSubtitle(me)}</span>
              ) : null}
              <Link href="/" className={s.homeLink}>
                Trang chủ
              </Link>
            </div>
          </div>
        ) : null}
        <nav className={s.nav}>
          {!navReady ? (
            <p className={s.navLoading} aria-live="polite">
              Đang tải menu…
            </p>
          ) : (
            <>
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

              {showClassNav &&
                (showExamNav ? (
                  <div className={s.group}>
                    <div className={s.groupLabel}>Lớp & học sinh</div>
                    <div className={s.subNav}>
                      <Link href="/teacher/classes" className={classes ? s.active : ''}>
                        Danh sách lớp
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className={s.group}>
                    <div className={s.subNav}>
                      <Link href="/teacher/classes" className={classes ? s.active : ''}>
                        Danh sách lớp
                      </Link>
                    </div>
                  </div>
                ))}

            </>
          )}
        </nav>
        <div className={s.asideFooter}>
          {showStaffMgmtLink ? (
            <Link href="/teacher/staff" className={`${s.staffMgmtLink} ${staff ? s.staffMgmtLinkActive : ''}`}>
              Tạo tài khoản phụ
            </Link>
          ) : null}
          <button type="button" className={s.logoutBtn} onClick={() => void logout()}>
            <svg className={s.logoutIcon} width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v3h2V5h14v14H5v-3H3v3a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"
              />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className={s.main}>{children}</main>
    </div>
  )
}
