import { neon } from '@neondatabase/serverless'

type Sql = ReturnType<typeof neon>

/** Hàng từ bảng exams — ép kiểu kết quả sql`...` (Neon union quá rộng). */
export type ExamRow = {
  id: number
  topic: string
  subject: string
  grade: string
  difficulty: string
  content: unknown
  created_at: Date | string
}

let sqlInstance: Sql | null = null

function getSql(): Sql {
  if (!sqlInstance) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    sqlInstance = neon(url)
  }
  return sqlInstance
}

/** Lazy: tránh gọi neon() lúc import (build không có DATABASE_URL). */
const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSql()(strings, ...values)) as Sql

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS exams (
      id        SERIAL PRIMARY KEY,
      topic     TEXT NOT NULL,
      subject   TEXT NOT NULL,
      grade     TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      content   JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS results (
      id              SERIAL PRIMARY KEY,
      exam_id         INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      student_name    TEXT NOT NULL,
      score           REAL NOT NULL,
      total_questions INTEGER NOT NULL,
      answers         JSONB NOT NULL,
      ai_comment      TEXT,
      submitted_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export default sql
