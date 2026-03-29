import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

/**
 * POST { code, name, password? }
 * - Đề không gắn lớp: chỉ cần tên (mật khẩu bỏ qua).
 * - Đề gắn lớp: tên + mật khẩu phải khớp học sinh thuộc một trong các lớp được gán.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, name, password } = await req.json()
    const examCode = String(code ?? '').trim().toUpperCase()
    const studentName = String(name ?? '').trim()
    const plainPw = String(password ?? '')

    if (!examCode || !studentName)
      return NextResponse.json({ error: 'Thiếu mã đề hoặc họ tên' }, { status: 400 })

    await initDB()

    const examRows = (await sql`
      SELECT id FROM exams WHERE exam_code = ${examCode}
    `) as { id: number }[]
    if (!examRows.length) return NextResponse.json({ error: 'Mã đề không tồn tại' }, { status: 404 })

    const examId = examRows[0].id

    const classRows = (await sql`
      SELECT class_id FROM exam_classes WHERE exam_id = ${examId}
    `) as { class_id: number }[]

    if (classRows.length === 0) {
      return NextResponse.json({
        examId,
        studentName,
        studentId: null as number | null,
        restricted: false,
      })
    }

    if (!plainPw) return NextResponse.json({ error: 'Đề này yêu cầu mật khẩu học sinh' }, { status: 403 })

    const students = (await sql`
      SELECT cs.id, cs.display_name, cs.password_salt, cs.password_hash, cs.class_id
      FROM class_students cs
      INNER JOIN exam_classes ec ON ec.class_id = cs.class_id AND ec.exam_id = ${examId}
    `) as Array<{
      id: number
      display_name: string
      password_salt: string
      password_hash: string
      class_id: number
    }>

    const match = students.find(
      s => s.display_name.trim().toLowerCase() === studentName.toLowerCase() && verifyPassword(plainPw, s.password_salt, s.password_hash)
    )

    if (!match)
      return NextResponse.json({ error: 'Đề này không dành cho bạn.' }, { status: 403 })

    return NextResponse.json({
      examId,
      studentName: match.display_name,
      studentId: match.id,
      restricted: true,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
