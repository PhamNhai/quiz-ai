'use client'

import { useEffect, useRef, useState } from 'react'
import s from './teacher-row-menu.module.css'

export function TeacherRowMenu(props: {
  label?: string
  items: { label: string; onClick: () => void }[]
}) {
  const { label = 'Thao tác ▾', items } = props
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  return (
    <div className={s.wrap} ref={ref}>
      <button type="button" className={s.btn} onClick={() => setOpen(o => !o)}>
        {label}
      </button>
      {open && (
        <ul className={s.list} role="menu">
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
        </ul>
      )}
    </div>
  )
}
