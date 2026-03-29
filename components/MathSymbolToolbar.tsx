'use client'

import s from './math-symbol-toolbar.module.css'

const SYMBOLS: { label: string; insert: string; title?: string }[] = [
  { label: 'x²', insert: '$x^2$', title: 'Lũy thừa' },
  { label: 'xₙ', insert: '$x_n$', title: 'Chỉ số dưới' },
  { label: '√', insert: '$\\sqrt{x}$', title: 'Căn bậc hai (sửa x)' },
  { label: '÷', insert: '$\\div$', title: 'Chia' },
  { label: '≤', insert: '$\\leq$', title: 'Nhỏ hơn hoặc bằng' },
  { label: '≥', insert: '$\\geq$', title: 'Lớn hơn hoặc bằng' },
  { label: 'π', insert: '$\\pi$', title: 'Pi' },
  { label: '∑', insert: '$\\sum$', title: 'Tổng sigma' },
]

/** Chèn snippet vào textarea/input, giữ vị trí con trỏ (dùng với controlled component + onInput). */
export function insertAtCursor(
  el: HTMLTextAreaElement | HTMLInputElement,
  value: string,
  snippet: string
): { next: string; caret: number } {
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? start
  const next = value.slice(0, start) + snippet + value.slice(end)
  const caret = start + snippet.length
  return { next, caret }
}

type Props = {
  /** Gọi khi bấm nút: (snippet) => void — parent cập nhật state + setSelectionRange sau render */
  onInsert: (snippet: string) => void
  className?: string
}

/** Thanh ký hiệu toán — bấm để chèn (LaTeX trong $...$). */
export function MathSymbolToolbar({ onInsert, className }: Props) {
  return (
    <div className={`${s.bar} ${className ?? ''}`} role="toolbar" aria-label="Chèn ký hiệu toán">
      {SYMBOLS.map(({ label, insert, title }) => (
        <button
          key={label}
          type="button"
          className={s.btn}
          title={title}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onInsert(insert)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
