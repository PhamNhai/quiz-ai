'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import s from './teacher-row-menu.module.css'

const MENU_MIN_W = 220

export function TeacherRowMenu(props: {
  label?: string
  items: { label: string; onClick: () => void }[]
}) {
  const { label = 'Thao tác ▾', items } = props
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const left = Math.max(8, r.right - MENU_MIN_W)
    const top = r.bottom + 4
    setCoords({ top, left })
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const m = menuRef.current
        const b = btnRef.current
        if (!m || !b) return
        const r2 = b.getBoundingClientRect()
        const h = m.offsetHeight
        let t2 = r2.bottom + 4
        if (t2 + h > window.innerHeight - 8) t2 = Math.max(8, r2.top - h - 4)
        setCoords({ top: t2, left: Math.max(8, r2.right - MENU_MIN_W) })
      })
    })
    return () => cancelAnimationFrame(id)
  }, [open, items.length])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
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
      <ul
        ref={menuRef}
        className={s.listPortal}
        role="menu"
        style={{ top: coords.top, left: coords.left }}
      >
        {items.map((it, i) => (
          <li key={i}>
            <button
              type="button"
              className={s.item}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                it.onClick()
              }}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>,
      document.body
    )

  return (
    <div className={s.wrap}>
      <button
        ref={btnRef}
        type="button"
        className={s.btn}
        onClick={e => {
          e.stopPropagation()
          setOpen(o => !o)
        }}
      >
        {label}
      </button>
      {menu}
    </div>
  )
}
