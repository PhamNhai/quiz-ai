'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import s from './class-multi-select.module.css'

export type ClassOption = { id: number; name: string; suffix?: string }

export function ClassMultiSelect(props: {
  classes: ClassOption[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  /** Khi chưa chọn lớp nào */
  placeholder?: string
}) {
  const { classes, selectedIds, onChange, placeholder = 'Chọn lớp…' } = props
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 })

  const byId = new Map(classes.map(c => [c.id, c]))
  const selected = selectedIds.map(id => byId.get(id)).filter(Boolean) as ClassOption[]

  const summary =
    selected.length === 0
      ? null
      : selected.length <= 2
        ? selected.map(c => `${c.name}${c.suffix ?? ''}`).join(', ')
        : `Đã chọn ${selected.length} lớp`

  function toggle(id: number) {
    const set = new Set(selectedIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange(Array.from(set))
  }

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setCoords({ top: r.bottom + 4, left: r.left, width: Math.max(260, r.width) })
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const m = menuRef.current
        const b = btnRef.current
        if (!m || !b) return
        const r2 = b.getBoundingClientRect()
        const h = m.offsetHeight
        let t = r2.bottom + 4
        if (t + h > window.innerHeight - 8) t = Math.max(8, r2.top - h - 4)
        setCoords({ top: t, left: r2.left, width: Math.max(260, r2.width) })
      })
    })
    return () => cancelAnimationFrame(id)
  }, [open, classes.length])

  useEffect(() => {
    function onDoc(e: Event) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    if (open) {
      document.addEventListener('click', onDoc)
      window.addEventListener('resize', onDoc)
    }
    return () => {
      document.removeEventListener('click', onDoc)
      window.removeEventListener('resize', onDoc)
    }
  }, [open])

  const menu =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        className={s.panel}
        role="listbox"
        aria-multiselectable
        style={{ top: coords.top, left: coords.left, width: coords.width }}
        onClick={e => e.stopPropagation()}
      >
        <ul className={s.list}>
          {classes.map(c => (
            <li key={c.id} role="option" aria-selected={selectedIds.includes(c.id)}>
              <label className={s.row}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <span>
                  {c.name}
                  {c.suffix ? <span className={s.suffixMuted}>{c.suffix}</span> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>,
      document.body
    )

  return (
    <div className={s.wrap}>
      <button
        ref={btnRef}
        type="button"
        className={s.trigger}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={e => {
          e.stopPropagation()
          setOpen(o => !o)
        }}
      >
        <span className={summary ? s.triggerText : `${s.triggerText} ${s.triggerTextMuted}`}>
          {summary ?? placeholder}
        </span>
        <span className={s.caret} aria-hidden>
          ▾
        </span>
      </button>
      {menu}
    </div>
  )
}
