import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo}>QuizAI</div>
        <Link href="/mo-ta-du-an" className={styles.navDoc}>
          Bản mô tả dự án
        </Link>
      </nav>
      <section className={styles.hero}>
        <h1 className={styles.headline}>Soạn đề thi<br /><em>thông minh hơn.</em></h1>
        <p className={styles.sub}>Tạo đề trắc nghiệm trong 30 giây. Học sinh làm bài online. AI chấm điểm và nhận xét tức thì.</p>
        <div className={styles.actions}>
          <Link href="/teacher" className={styles.btnPrimary}>Khu vực giáo viên <span>→</span></Link>
          <Link href="/exam" className={styles.btnSecondary}>Làm bài thi</Link>
        </div>
        <p className={styles.docTeaser}>
          <Link href="/mo-ta-du-an">Mô tả chi tiết dự án (mục tiêu, quy trình, AI, hướng phát triển) — dùng cho báo cáo / cuộc thi</Link>
        </p>
      </section>
      <section className={styles.features}>
        {[
          { icon: '✦', title: 'Soạn đề AI', desc: 'Chọn môn, lớp, chủ đề — AI (Gemini) gợi ý câu hỏi theo chương trình phổ thông.' },
          { icon: '◈', title: 'Làm bài trực tuyến', desc: 'Chia sẻ link cho học sinh. Không cần đăng ký tài khoản.' },
          { icon: '◉', title: 'Nhận xét thông minh', desc: 'AI phân tích điểm mạnh/yếu, đưa ra lời khuyên cá nhân hóa.' },
        ].map(f => (
          <div key={f.title} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
