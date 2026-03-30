import { neon } from '@neondatabase/serverless'
import { hashPassword } from '@/lib/password'

type Sql = ReturnType<typeof neon>

/** Hàng từ bảng exams — ép kiểu kết quả sql`...` (Neon union quá rộng). */
export type ExamRow = {
  id: number
  exam_code: string
  topic: string
  subject: string
  grade: string
  difficulty: string
  allow_retake: boolean
  content: unknown
  created_at: Date | string
  /** Phút làm bài; null = không giới hạn */
  duration_minutes?: number | null
  created_by?: number | null
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
      id           SERIAL PRIMARY KEY,
      exam_code    TEXT,
      topic        TEXT NOT NULL,
      subject      TEXT NOT NULL,
      grade        TEXT NOT NULL,
      difficulty   TEXT NOT NULL,
      allow_retake BOOLEAN DEFAULT TRUE,
      content      JSONB NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_code TEXT`
  await sql`ALTER TABLE exams ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN DEFAULT TRUE`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS exams_exam_code_key ON exams (exam_code)`
  await sql`ALTER TABLE exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER`

  await sql`
    CREATE TABLE IF NOT EXISTS staff_users (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('admin', 'school_manager', 'teacher')),
      display_name  TEXT DEFAULT '',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_by INTEGER`
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exams_created_by_fkey'
      ) THEN
        ALTER TABLE exams
          ADD CONSTRAINT exams_created_by_fkey
          FOREIGN KEY (created_by) REFERENCES staff_users(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `

  await seedStaffUsers(getSql())
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
  await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS student_id INTEGER`
  await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS duration_ms INTEGER`

  await sql`
    CREATE TABLE IF NOT EXISTS classes (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS class_students (
      id           SERIAL PRIMARY KEY,
      class_id     INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      note         TEXT DEFAULT '',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (class_id, display_name)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS exam_classes (
      exam_id  INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      PRIMARY KEY (exam_id, class_id)
    )
  `
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS code TEXT`
  await sql`
    UPDATE classes SET code = 'c' || id::text
    WHERE code IS NULL OR TRIM(code) = ''
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS classes_code_key ON classes (code)`
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS note TEXT DEFAULT ''`

  await sql`
    CREATE TABLE IF NOT EXISTS site_pages (
      slug       TEXT PRIMARY KEY,
      payload    JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'results_student_id_fkey'
      ) THEN
        ALTER TABLE results
          ADD CONSTRAINT results_student_id_fkey
          FOREIGN KEY (student_id) REFERENCES class_students(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `
}

async function seedStaffUsers(sql: Sql) {
  const adminRows = (await sql`SELECT id FROM staff_users WHERE username = 'adminer'`) as { id: number }[]
  if (!adminRows.length) {
    const h = hashPassword('Thptdongtho1@')
    await sql`
      INSERT INTO staff_users (username, password_hash, role, display_name)
      VALUES ('adminer', ${h}, 'admin', 'Quản trị')
    `
  }
  const envU = (process.env.TEACHER_USERNAME ?? '').trim()
  const envP = (process.env.TEACHER_PASSWORD ?? '').trim()
  if (envU && envP && envU !== 'adminer') {
    const ex = (await sql`SELECT id FROM staff_users WHERE username = ${envU}`) as { id: number }[]
    if (!ex.length) {
      await sql`
        INSERT INTO staff_users (username, password_hash, role, display_name)
        VALUES (${envU}, ${hashPassword(envP)}, 'teacher', 'Giáo viên')
      `
    }
  }
  const staffSeed = (await sql`SELECT id FROM staff_users WHERE username = 'dongthostaff'`) as {
    id: number
  }[]
  if (!staffSeed.length) {
    await sql`
      INSERT INTO staff_users (username, password_hash, role, display_name)
      VALUES ('dongthostaff', ${hashPassword('staff01@')}, 'school_manager', 'Phụ trách lớp')
    `
  }
}

/** Mã đề duy nhất: nếu trùng thì thêm hậu tố -2, -3, ... */
export async function generateUniqueCode(base: string): Promise<string> {
  const clean =
    base.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48) || `DE${Date.now().toString(36).toUpperCase()}`
  let candidate = clean.toUpperCase()
  let n = 0
  while (true) {
    const rows = (await sql`SELECT id FROM exams WHERE exam_code = ${candidate}`) as { id: number }[]
    if (!rows.length) return candidate
    n += 1
    candidate = `${clean.toUpperCase()}-${n}`
  }
}

export default sql
