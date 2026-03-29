'use client'

import s from './math-symbol-toolbar.module.css'

const SYMBOLS: { label: string; insert: string; title?: string }[] = [
  { label: 'x²', insert: '$x^2$', title: 'Lũy thừa' },
  { label: 'xₙ', insert: '$x_n$', title: 'Chỉ số dưới' },
  { label: 'a/b', insert: '$\\frac{a}{b}$', title: 'Phân số (sửa a, b)' },
  { label: '√', insert: '$\\sqrt{x}$', title: 'Căn bậc hai (sửa x)' },
  { label: 'ⁿ√', insert: '$\\sqrt[n]{x}$', title: 'Căn bậc n (sửa n, x)' },
  { label: '÷', insert: '$\\div$', title: 'Chia' },
  { label: '·', insert: '$\\cdot$', title: 'Nhân dấu chấm' },
  { label: '±', insert: '$\\pm$', title: 'Cộng trừ' },
  { label: '≤', insert: '$\\leq$', title: 'Nhỏ hơn hoặc bằng' },
  { label: '≥', insert: '$\\geq$', title: 'Lớn hơn hoặc bằng' },
  { label: '≠', insert: '$\\neq$', title: 'Khác' },
  { label: '≈', insert: '$\\approx$', title: 'Xấp xỉ' },
  { label: '∞', insert: '$\\infty$', title: 'Vô cực' },
  { label: 'π', insert: '$\\pi$', title: 'Pi' },
  { label: '∑', insert: '$\\sum$', title: 'Tổng sigma' },
  { label: '∫', insert: '$\\int$', title: 'Tích phân' },
  { label: 'lim', insert: '$\\lim$', title: 'Giới hạn' },
  { label: '→', insert: '$\\rightarrow$', title: 'Mũi tên phải' },
  { label: '∠', insert: '$\\angle$', title: 'Góc' },
  { label: '△', insert: '$\\triangle$', title: 'Tam giác' },
  { label: 'α', insert: '$\\alpha$', title: 'Alpha' },
  { label: 'β', insert: '$\\beta$', title: 'Beta' },
  { label: 'θ', insert: '$\\theta$', title: 'Theta' },
  { label: 'Δ', insert: '$\\Delta$', title: 'Delta' },
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
      {SYMBOLS.map(({ label, insert, title }, idx) => (
        <button
          key={`${idx}-${insert}`}
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
