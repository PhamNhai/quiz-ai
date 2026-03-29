'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import s from './teacher-shell.module.css'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const noShell =
    pathname.startsWith('/teacher/review') ||
    pathname.startsWith('/teacher/success') ||
    pathname.startsWith('/teacher/stats')
  if (noShell) return <>{children}</>

  const dash = pathname === '/teacher'
  const create = pathname.startsWith('/teacher/create')
  const classes = pathname.startsWith('/teacher/classes')

  return (
    <div className={s.shell}>
      <aside className={s.aside}>
        <Link href="/teacher" className={s.brand}>
          QuizAI
        </Link>
        <nav className={s.nav}>
          <Link href="/teacher" className={dash ? s.active : ''}>
            Tổng quan
          </Link>
          <Link href="/teacher/create" className={create ? s.active : ''}>
            Tạo đề mới
          </Link>
          <Link href="/teacher/classes" className={classes ? s.active : ''}>
            Lớp học
          </Link>
        </nav>
        <div className={s.footer}>
          <Link href="/">← Trang chủ</Link>
        </div>
      </aside>
      <main className={s.main}>{children}</main>
    </div>
  )
}
