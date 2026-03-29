/** CSV mở ổn trong Excel (VN): UTF-8 BOM, `sep=;`, phân cách `;`, xuống dòng CRLF. */
const SEP = ';'

function escCell(v: string | number): string {
  const s = String(v)
  if (s.includes(SEP) || s.includes('"') || /[\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toExcelCsv(header: string[], rows: (string | number)[][]): string {
  const line = (cols: (string | number)[]) => cols.map(escCell).join(SEP)
  const body = [line(header), ...rows.map(line)].join('\r\n')
  return `\uFEFFsep=${SEP}\r\n${body}`
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
