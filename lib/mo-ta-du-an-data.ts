import sql, { initDB } from '@/lib/db'
import type { MoTaPayload, MoTaSection } from '@/lib/mo-ta-du-an-content'
import { getDefaultMoTaPayload } from '@/lib/mo-ta-du-an-content'

const SLUG = 'mo_ta_du_an'

function isNonEmptyString(x: unknown, max: number): x is string {
  return typeof x === 'string' && x.trim().length > 0 && x.length <= max
}

function parseSection(raw: unknown): MoTaSection | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim().slice(0, 64) : null
  const title = typeof o.title === 'string' && o.title.trim() ? o.title.trim().slice(0, 500) : null
  if (!id || !title) return null
  const paragraphs = Array.isArray(o.paragraphs)
    ? o.paragraphs.filter((p): p is string => typeof p === 'string').map(p => p.slice(0, 8000))
    : []
  if (paragraphs.length === 0) return null
  let bullets: string[] | undefined
  if (Array.isArray(o.bullets) && o.bullets.length) {
    bullets = o.bullets
      .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
      .map(b => b.slice(0, 4000))
  }
  return { id, title, paragraphs, bullets }
}

/** Kiểm tra payload từ DB hoặc từ client PUT. */
export function parseMoTaPayload(raw: unknown): MoTaPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const meta = o.meta as Record<string, unknown> | undefined
  if (!meta || typeof meta !== 'object') return null
  const title = meta.title
  const subtitle = meta.subtitle
  if (!isNonEmptyString(title, 500) || !isNonEmptyString(subtitle, 2000)) return null
  const sectionsRaw = o.sections
  if (!Array.isArray(sectionsRaw) || sectionsRaw.length === 0 || sectionsRaw.length > 30) return null
  const sections: MoTaSection[] = []
  for (const s of sectionsRaw) {
    const sec = parseSection(s)
    if (!sec) return null
    sections.push(sec)
  }
  const footer = o.footerNote
  if (typeof footer !== 'string' || footer.length > 12000) return null
  return {
    meta: { title: title.trim(), subtitle: subtitle.trim() },
    sections,
    footerNote: footer,
  }
}

export async function getMoTaDuAnPayload(): Promise<MoTaPayload> {
  await initDB()
  const rows = (await sql`
    SELECT payload FROM site_pages WHERE slug = ${SLUG}
  `) as Array<{ payload: unknown }>
  if (!rows.length) return getDefaultMoTaPayload()
  let raw: unknown = rows[0].payload
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw) as unknown
    } catch {
      return getDefaultMoTaPayload()
    }
  }
  const parsed = parseMoTaPayload(raw)
  return parsed ?? getDefaultMoTaPayload()
}

export async function saveMoTaDuAnPayload(payload: MoTaPayload): Promise<void> {
  await initDB()
  const json = JSON.stringify(payload)
  await sql`
    INSERT INTO site_pages (slug, payload, updated_at)
    VALUES (${SLUG}, ${json}, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = NOW()
  `
}
