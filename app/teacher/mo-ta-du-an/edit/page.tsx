'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStaffMe } from '../../useStaffMe'
import { canAccessStaffManagementPage } from '@/lib/staff-nav-access'
import type { MoTaPayload, MoTaSection } from '@/lib/mo-ta-du-an-content'
import m from '../../manage/manage.module.css'
import s from './edit.module.css'

type Row = {
  id: string
  title: string
  paragraphText: string
  bulletText: string
}

function payloadToRows(p: MoTaPayload): Row[] {
  return p.sections.map(sec => ({
    id: sec.id,
    title: sec.title,
    paragraphText: sec.paragraphs.join('\n\n'),
    bulletText: (sec.bullets ?? []).join('\n'),
  }))
}

function rowsToPayload(
  title: string,
  subtitle: string,
  footerNote: string,
  rows: Row[]
): MoTaPayload | null {
  const sections: MoTaSection[] = []
  for (const r of rows) {
    const paragraphs = r.paragraphText
      .split(/\n\n+/)
      .map(x => x.trim())
      .filter(Boolean)
    const id = r.id.trim()
    const st = r.title.trim()
    if (!id || !st || paragraphs.length === 0) return null
    const bulletLines = r.bulletText
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
    sections.push({
      id,
      title: st,
      paragraphs,
      bullets: bulletLines.length ? bulletLines : undefined,
    })
  }
  if (!sections.length) return null
  const mt = title.trim()
  const sub = subtitle.trim()
  if (!mt || !sub) return null
  return {
    meta: { title: mt, subtitle: sub },
    sections,
    footerNote: footerNote.trim(),
  }
}

export default function EditMoTaDuAnPage() {
  const router = useRouter()
  const me = useStaffMe()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaSub, setMetaSub] = useState('')
  const [footerNote, setFooterNote] = useState('')
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    if (me === undefined) return
    if (me === null || !canAccessStaffManagementPage(me)) {
      router.replace('/teacher/classes')
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/site-content/mo-ta-du-an', { credentials: 'include' })
        const data = (await res.json()) as MoTaPayload
        if (!res.ok || !data?.meta) {
          setErr('Không tải được nội dung')
          setLoading(false)
          return
        }
        setMetaTitle(data.meta.title)
        setMetaSub(data.meta.subtitle)
        setFooterNote(data.footerNote ?? '')
        setRows(payloadToRows(data))
      } catch {
        setErr('Lỗi tải')
      } finally {
        setLoading(false)
      }
    })()
  }, [me, router])

  function addSection() {
    setRows(prev => [
      ...prev,
      {
        id: `muc-${Date.now()}`,
        title: 'Mục mới',
        paragraphText: 'Nội dung đoạn văn.',
        bulletText: '',
      },
    ])
  }

  function removeSection(i: number) {
    setRows(prev => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)))
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows(prev => {
      const next = [...prev]
      next[i] = { ...next[i]!, ...patch }
      return next
    })
  }

  async function onSave() {
    setErr('')
    const payload = rowsToPayload(metaTitle, metaSub, footerNote, rows)
    if (!payload) {
      setErr('Kiểm tra: tiêu đề, phụ đề, mỗi mục cần id, tiêu đề và ít nhất một đoạn văn.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/site-content/mo-ta-du-an', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof j.error === 'string' ? j.error : 'Không lưu được')
        return
      }
      router.push('/mo-ta-du-an')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (me === undefined || loading) {
    return (
      <div className={m.page}>
        <div className={m.center}>
          <div className={m.spin} />
        </div>
      </div>
    )
  }

  return (
    <div className={m.page}>
      <div className={m.dashTop}>
        <div>
          <h1 className={m.h1}>Sửa bản mô tả dự án</h1>
          <p className={m.lead}>Nội dung hiển thị ở trang công khai /mo-ta-du-an và file Word tải về.</p>
        </div>
        <Link href="/mo-ta-du-an" className={m.link} target="_blank" rel="noreferrer">
          Xem trang công khai ↗
        </Link>
      </div>

      <div className={`${m.container} ${s.form}`}>
        {err ? <p className={s.err}>{err}</p> : null}

        <div className={s.row2}>
          <div>
            <label className={s.lbl} htmlFor="mt">
              Tiêu đề chính
            </label>
            <input
              id="mt"
              className={s.input}
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
            />
          </div>
          <div>
            <label className={s.lbl} htmlFor="ms">
              Dòng phụ (subtitle)
            </label>
            <input
              id="ms"
              className={s.input}
              value={metaSub}
              onChange={e => setMetaSub(e.target.value)}
            />
          </div>
        </div>

        <p className={s.hintSm}>Mỗi mục: &quot;Id&quot; dùng làm neo link (#id) — nên giữ chữ thường, gạch ngang.</p>

        {rows.map((r, i) => (
          <div key={i} className={s.sectionCard}>
            <div className={s.sectionHead}>
              <h3 className={s.sectionTitle}>Mục {i + 1}</h3>
              <button type="button" className={s.btnDanger} onClick={() => removeSection(i)}>
                Xóa mục
              </button>
            </div>
            <label className={s.lbl}>Id (neo)</label>
            <input
              className={s.input}
              value={r.id}
              onChange={e => updateRow(i, { id: e.target.value })}
              spellCheck={false}
            />
            <label className={s.lbl}>Tiêu đề mục</label>
            <input
              className={s.input}
              value={r.title}
              onChange={e => updateRow(i, { title: e.target.value })}
            />
            <label className={s.lbl}>Đoạn văn (mỗi đoạn cách nhau một dòng trống)</label>
            <textarea
              className={s.textarea}
              rows={6}
              value={r.paragraphText}
              onChange={e => updateRow(i, { paragraphText: e.target.value })}
            />
            <label className={s.lbl}>Gạch đầu dòng (tuỳ chọn, mỗi dòng một ý)</label>
            <textarea
              className={s.textarea}
              rows={4}
              value={r.bulletText}
              onChange={e => updateRow(i, { bulletText: e.target.value })}
            />
          </div>
        ))}

        <button type="button" className={s.btnAdd} onClick={addSection}>
          + Thêm mục
        </button>

        <label className={s.lbl} htmlFor="fn">
          Đoạn chân trang
        </label>
        <textarea
          id="fn"
          className={s.textarea}
          rows={3}
          value={footerNote}
          onChange={e => setFooterNote(e.target.value)}
        />

        <div className={s.actionsBottom}>
          <button type="button" className={s.btnSave} disabled={saving} onClick={() => void onSave()}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
          <Link href="/teacher/classes" className={m.link}>
            ← Về danh sách lớp
          </Link>
        </div>
      </div>
    </div>
  )
}
