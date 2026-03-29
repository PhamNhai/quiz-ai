'use client'

import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Fragment, useMemo } from 'react'

function renderKatex(tex: string, display: boolean): string {
  return katex.renderToString(tex.trim(), {
    throwOnError: false,
    displayMode: display,
    strict: 'ignore',
  })
}

/** Hiển thị text + LaTeX: $...$ inline, $$...$$ display; phần không có $ giữ nguyên. */
export function MathText({ text, as: Tag = 'span', className }: { text: string; as?: 'span' | 'p' | 'div'; className?: string }) {
  const html = useMemo(() => buildNodes(text), [text])
  return <Tag className={className}>{html}</Tag>
}

function buildNodes(text: string): React.ReactNode[] {
  if (!text) return []
  if (!text.includes('$')) return [text]

  const out: React.ReactNode[] = []
  let key = 0

  if (text.includes('$$')) {
    const displayParts = text.split('$$')
    for (let i = 0; i < displayParts.length; i++) {
      const seg = displayParts[i]
      if (i % 2 === 0) {
        out.push(...buildInlineNodes(seg, () => key++))
      } else {
        out.push(
          <span
            key={`d${key++}`}
            className="math-display-wrap"
            dangerouslySetInnerHTML={{ __html: renderKatex(seg, true) }}
          />
        )
      }
    }
    return out
  }

  return buildInlineNodes(text, () => key++)
}

function buildInlineNodes(text: string, nextKey: () => number): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\$([^$]+)\$/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={`t${nextKey()}`}>{text.slice(last, m.index)}</Fragment>)
    out.push(
      <span
        key={`m${nextKey()}`}
        className="math-inline"
        dangerouslySetInnerHTML={{ __html: renderKatex(m[1] ?? '', false) }}
      />
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<Fragment key={`t${nextKey()}`}>{text.slice(last)}</Fragment>)
  if (out.length === 0) return [text]
  return out
}
