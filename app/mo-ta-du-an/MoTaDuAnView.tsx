'use client'

import Link from 'next/link'
import { useStaffMe } from '../teacher/useStaffMe'
import type { MoTaPayload } from '@/lib/mo-ta-du-an-content'
import { canAccessStaffManagementPage } from '@/lib/staff-nav-access'
import s from './page.module.css'

export default function MoTaDuAnView({ data }: { data: MoTaPayload }) {
  const me = useStaffMe()
  const canEdit = me != null && canAccessStaffManagementPage(me)

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <Link href="/" className={s.back}>
          ← Trang chủ QuizAI
        </Link>
        <div className={s.actions}>
          {canEdit ? (
            <Link href="/teacher/mo-ta-du-an/edit" className={s.btnEdit}>
              Sửa nội dung
            </Link>
          ) : null}
          <a href="/api/mo-ta-du-an/word" className={s.btnWord} download>
            Tải bản Word (.doc)
          </a>
          <button type="button" className={s.btnPrint} onClick={() => window.print()}>
            In / lưu PDF
          </button>
        </div>
        <p className={s.hint}>
          File Word: mở bằng Microsoft Word, có thể &quot;Lưu như&quot; định dạng .docx. In/PDF: dùng hộp thoại in của trình duyệt.
        </p>
      </div>

      <article>
        <h1 className={s.title}>{data.meta.title}</h1>
        <p className={s.subtitle}>{data.meta.subtitle}</p>

        {data.sections.map(sec => (
          <section key={sec.id} id={sec.id} className={s.section}>
            <h2 className={s.sectionTitle}>{sec.title}</h2>
            {sec.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {sec.bullets && sec.bullets.length > 0 ? (
              <ul className={s.list}>
                {sec.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className={s.note}>{data.footerNote}</p>
      </article>
    </div>
  )
}
