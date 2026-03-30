import * as XLSX from 'xlsx'
import { parseCsvLine } from '@/lib/csv-excel'

export type StudentImportRow = { name: string; password: string; note: string }

function normHeader(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const NAME_ALIASES = ['name', 'ten', 'ho ten', 'hoten', 'displayname', 'display_name', 'họ tên', 'tên']
const PASS_ALIASES = ['password', 'mat khau', 'matkhau', 'pass', 'mk', 'mật khẩu']
const NOTE_ALIASES = ['note', 'ghi chu', 'ghichu', 'ghi chú', 'remark', 'chu thich']

function findColIndex(headers: string[], aliases: string[]): number {
  const n = headers.map(h => normHeader(String(h ?? '')))
  const want = new Set(aliases.map(normHeader))
  for (let i = 0; i < n.length; i++) {
    const h = n[i]!
    if (want.has(h)) return i
  }
  for (let i = 0; i < n.length; i++) {
    const h = n[i]!
    for (const a of aliases) {
      const na = normHeader(a)
      if (na.length >= 2 && (h.includes(na) || na.includes(h))) return i
    }
  }
  return -1
}

function matrixFromFirstSheet(buf: ArrayBuffer): string[][] {
  const wb = XLSX.read(buf, { type: 'array' })
  const name = wb.SheetNames[0]
  if (!name) return []
  const sheet = wb.Sheets[name]
  if (!sheet) return []
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][]
  return raw.map(row => row.map(c => (c == null ? '' : String(c))))
}

/** Dòng đầu: tiêu đề name / password / note (hoặc tương đương); các dòng sau: dữ liệu. */
export function parseStudentRowsFromExcelBuffer(buf: ArrayBuffer): StudentImportRow[] {
  const data = matrixFromFirstSheet(buf)
  if (data.length < 2) return []
  const headerRow = data[0]!.map(c => String(c ?? ''))
  let cName = findColIndex(headerRow, NAME_ALIASES)
  let cPass = findColIndex(headerRow, PASS_ALIASES)
  let cNote = findColIndex(headerRow, NOTE_ALIASES)
  if (cName < 0) cName = 0
  if (cPass < 0) cPass = 1
  if (cNote < 0) cNote = 2

  const out: StudentImportRow[] = []
  for (let r = 1; r < data.length; r++) {
    const row = data[r]!
    const name = String(row[cName] ?? '').trim()
    const password = String(row[cPass] ?? '').trim()
    const note = String(row[cNote] ?? '').trim()
    if (!name && !password) continue
    out.push({ name, password, note })
  }
  return out
}

/** Cùng định dạng với ô nhập CSV trên trang lớp. */
export function parseStudentRowsFromCsvText(csvText: string): StudentImportRow[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  let i0 = 0
  if (lines[0]!.toLowerCase().startsWith('sep=')) i0 = 1
  const headerLine = (lines[i0] ?? '').toLowerCase()
  const sep = headerLine.includes(';') ? ';' : ','
  const rows: StudentImportRow[] = []
  for (let i = i0 + 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]!, sep)
    rows.push({
      name: (parts[0] ?? '').trim(),
      password: (parts[1] ?? '').trim(),
      note: (parts[2] ?? '').trim(),
    })
  }
  return rows
}
