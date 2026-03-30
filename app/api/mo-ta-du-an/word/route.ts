import { NextResponse } from 'next/server'
import { getMoTaDuAnPayload } from '@/lib/mo-ta-du-an-data'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Xuất file .doc (HTML) mở được bằng Microsoft Word — không cần thư viện ngoài. */
export async function GET() {
  const doc = await getMoTaDuAnPayload()
  let body = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>${escapeHtml(doc.meta.title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.45;max-width:720px;margin:24px auto;padding:0 16px;}
h1{font-size:16pt;text-align:center;margin-bottom:8px;}
h2{font-size:13pt;margin-top:1.1em;margin-bottom:0.4em;}
p{margin:0.35em 0;text-align:justify;}
ul{margin:0.25em 0 0.6em 1.1em;}
li{margin:0.2em 0;}
.sub{text-align:center;font-size:11pt;color:#444;margin-bottom:1.2em;}
.footer{margin-top:1.8em;font-size:10pt;color:#555;}
</style>
</head>
<body>
<h1>${escapeHtml(doc.meta.title)}</h1>
<p class="sub">${escapeHtml(doc.meta.subtitle)}</p>
`

  for (const sec of doc.sections) {
    body += `<h2>${escapeHtml(sec.title)}</h2>`
    for (const p of sec.paragraphs) {
      body += `<p>${escapeHtml(p)}</p>`
    }
    if (sec.id === 'so-do-luong') {
      body += `<p><em>Sơ đồ SVG và prompt đầy đủ: xem trang web /mo-ta-du-an (mục 9).</em></p>`
      body += `<pre style="font-size:10pt;background:#f5f5f5;padding:8px;border:1px solid #ddd;">Data Flow (ASCII):
Browser → POST /api/generate-exam hoặc /submit-result → Next.js → HTTPS → Gemini / OpenAI-compat → JSON → (đề: review) / (bài: lưu results + ai_comment)
System prompt (ý): Trợ lý giáo dục, giữ dấu tiếng Việt — xem lib/gemini.ts</pre>`
    }
    if (sec.bullets?.length) {
      body += '<ul>'
      for (const b of sec.bullets) {
        body += `<li>${escapeHtml(b)}</li>`
      }
      body += '</ul>'
    }
  }

  body += `<p class="footer">${escapeHtml(doc.footerNote)}</p>
<p class="footer">Tài liệu xuất từ website QuizAI. Mở bằng Word → có thể chỉnh sửa và lưu dạng .docx (Lưu như).</p>
</body></html>`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/msword; charset=utf-8',
      'Content-Disposition': 'attachment; filename="Mo-ta-du-an-QuizAI.doc"',
    },
  })
}
