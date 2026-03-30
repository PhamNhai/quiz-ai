import { NextRequest, NextResponse } from 'next/server'
import { getMoTaDuAnPayload, parseMoTaPayload, saveMoTaDuAnPayload } from '@/lib/mo-ta-du-an-data'
import { canManageStaffAccounts, forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

/** Tránh 405 nếu client/proxy gửi OPTIONS (preflight). */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'GET, POST, PUT, OPTIONS' },
  })
}

export async function GET() {
  try {
    const payload = await getMoTaDuAnPayload()
    return NextResponse.json(payload)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function handleSave(req: NextRequest) {
  const session = await getStaffSession(req)
  if (!session) return unauthorized()
  if (!canManageStaffAccounts(session)) return forbidden()
  const body = await req.json()
  const parsed = parseMoTaPayload(body)
  if (!parsed) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ (tiêu đề, các mục, đoạn văn).' },
      { status: 400 }
    )
  }
  await saveMoTaDuAnPayload(parsed)
  return NextResponse.json({ ok: true })
}

/** Một số proxy/hosting chặn PUT → 405; client dùng POST. */
export async function POST(req: NextRequest) {
  try {
    return await handleSave(req)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    return await handleSave(req)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lỗi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
