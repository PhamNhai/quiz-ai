import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { getExamIfAllowed } from '@/lib/exam-access'
import { forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

/** Gán đề với các lớp (thay toàn bộ danh sách). Body: { classIds: number[] } */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getStaffSession(req)
    if (!session) return unauthorized()
    await initDB()
    const examId = Number(params.id)
    if (Number.isNaN(examId)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
    const allowed = await getExamIfAllowed(session, examId)
    if (!allowed) return forbidden()
    const { classIds } = await req.json()
    const ids = Array.isArray(classIds)
      ? classIds.map((x: unknown) => Number(x)).filter(n => !Number.isNaN(n) && n > 0)
      : []

    await sql`DELETE FROM exam_classes WHERE exam_id = ${examId}`
    for (const cid of ids) {
      await sql`
        INSERT INTO exam_classes (exam_id, class_id) VALUES (${examId}, ${cid})
        ON CONFLICT (exam_id, class_id) DO NOTHING
      `
    }
    const rows = (await sql`
      SELECT c.id, c.name FROM exam_classes ec
      JOIN classes c ON c.id = ec.class_id
      WHERE ec.exam_id = ${examId}
      ORDER BY c.name
    `) as { id: number; name: string }[]
    return NextResponse.json({ success: true, classes: rows })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
