import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bản mô tả dự án — QuizAI',
  description:
    'Mục tiêu, đối tượng, quy trình, hiệu quả, công cụ AI và hướng phát triển — tài liệu tham khảo cuộc thi',
}

export default function MoTaDuAnLayout({ children }: { children: React.ReactNode }) {
  return children
}
