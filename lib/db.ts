import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

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
