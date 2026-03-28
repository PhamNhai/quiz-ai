import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500'] })
const serif = Instrument_Serif({ subsets: ['latin'], variable: '--font-display', weight: '400', style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: 'QuizAI — Tạo đề thi thông minh',
  description: 'Hệ thống tạo đề trắc nghiệm và chấm bài tự động bằng AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${dmSans.variable} ${serif.variable}`}>{children}</body>
    </html>
  )
}
