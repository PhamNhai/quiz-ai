/** CSV: UTF-8 BOM, phân cách `;`, CRLF (Excel VN thường dùng `;`). */
const SEP = ';'

function escCell(v: string | number): string {
  const s = String(v)
  if (s.includes(SEP) || s.includes('"') || s.includes('\t') || /[\r\n]/.test(s))
    return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Tránh Excel tự coi `3/5` là ngày — thêm tab ẩn ở đầu ô (vẫn hiển thị đúng). */
export function excelSafeScoreText(score: number, total: number): string {
  return `\t${score}/${total}`
}

/**
 * Chuỗi CSV đầy đủ (có BOM) → Blob UTF-8 thật (ổn định hơn khi tải, Excel nhận UTF-8).
 */
export function csvStringToUtf8Blob(csvWithBom: string): Blob {
  return new Blob([new TextEncoder().encode(csvWithBom)], {
    type: 'text/csv;charset=utf-8',
  })
}

export function toExcelCsv(header: string[], rows: (string | number)[][]): string {
  const line = (cols: (string | number)[]) => cols.map(escCell).join(SEP)
  const body = [line(header), ...rows.map(line)].join('\r\n')
  return `\uFEFF${body}`
}

/** Một dòng CSV có thể có ô trong ngoặc kép (dùng khi nhập lại từ Excel). */
export function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'
        i++
        continue
      }
      inQ = !inQ
      continue
    }
    if (!inQ && c === sep) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out.map(s => s.trim())
}
