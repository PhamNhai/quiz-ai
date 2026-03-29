import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo}>QuizAI</div>
      </nav>
      <section className={styles.hero}>
        <h1 className={styles.headline}>Soạn đề thi<br /><em>thông minh hơn.</em></h1>
        <p className={styles.sub}>Tạo đề trắc nghiệm trong 30 giây. Học sinh làm bài online. AI chấm điểm và nhận xét tức thì.</p>
        <div className={styles.actions}>
          <Link href="/teacher" className={styles.btnPrimary}>Khu vực giáo viên <span>→</span></Link>
          <Link href="/exam" className={styles.btnSecondary}>Làm bài thi</Link>
        </div>
      </section>
      <section className={styles.features}>
        {[
          { icon: '✦', title: 'Soạn đề AI', desc: 'Chọn môn, lớp, chủ đề — Claude tạo câu hỏi chuẩn chương trình Việt Nam.' },
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
