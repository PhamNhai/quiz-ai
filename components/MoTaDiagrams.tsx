'use client'

import s from './MoTaDiagrams.module.css'

/** Minh họa tĩnh — không gọi API; nội dung khớp `lib/gemini.ts`. */
export default function MoTaDiagrams() {
  return (
    <div className={s.wrap}>
      <h3 className={s.h3}>Sơ đồ luồng dữ liệu (Data Flow)</h3>
      <figure className={s.fig}>
        <svg viewBox="0 0 720 280" className={s.svg} xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--text-3, #71717a)" />
            </marker>
          </defs>
          <rect x="20" y="40" width="120" height="48" rx="8" fill="var(--accent-light, #e0e7ff)" stroke="var(--border-strong)" />
          <text x="80" y="70" textAnchor="middle" fontSize="12" fill="var(--text)">
            Trình duyệt
          </text>
          <line x1="140" y1="64" x2="200" y2="64" stroke="var(--text-3)" markerEnd="url(#arr)" />
          <rect x="200" y="32" width="140" height="64" rx="8" fill="var(--surface2, #f4f4f5)" stroke="var(--border-strong)" />
          <text x="270" y="58" textAnchor="middle" fontSize="11" fill="var(--text)">
            Next.js API
          </text>
          <text x="270" y="78" textAnchor="middle" fontSize="10" fill="var(--text-3)">
            /api/generate-exam, /submit-result
          </text>
          <line x1="340" y1="64" x2="400" y2="64" stroke="var(--text-3)" markerEnd="url(#arr)" />
          <rect x="400" y="24" width="160" height="80" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          <text x="480" y="52" textAnchor="middle" fontSize="11" fill="var(--text)">
            API AI bên ngoài
          </text>
          <text x="480" y="72" textAnchor="middle" fontSize="10" fill="var(--text-3)">
            Google Gemini / OpenAI-compat
          </text>
          <text x="480" y="92" textAnchor="middle" fontSize="9" fill="var(--text-3)">
            (HTTPS, khóa API)
          </text>
          <line x1="480" y1="104" x2="480" y2="140" stroke="var(--text-3)" markerEnd="url(#arr)" />
          <rect x="400" y="140" width="160" height="56" rx="8" fill="var(--surface2)" stroke="var(--border-strong)" />
          <text x="480" y="174" textAnchor="middle" fontSize="11" fill="var(--text)">
            Phản hồi JSON / văn bản
          </text>
          <line x1="400" y1="168" x2="330" y2="168" stroke="var(--text-3)" markerEnd="url(#arr)" />
          <line x1="200" y1="168" x2="140" y2="168" stroke="var(--text-3)" markerEnd="url(#arr)" />
          <rect x="20" y="140" width="120" height="56" rx="8" fill="var(--surface2)" stroke="var(--border-strong)" />
          <text x="80" y="174" textAnchor="middle" fontSize="11" fill="var(--text)">
            UI / Kết quả
          </text>
          <line x1="270" y1="96" x2="270" y2="200" stroke="var(--text-3)" strokeDasharray="4 3" />
          <line x1="270" y1="200" x2="400" y2="220" stroke="var(--text-3)" markerEnd="url(#arr)" />
          <rect x="400" y="210" width="160" height="52" rx="8" fill="#ecfdf5" stroke="#059669" />
          <text x="480" y="242" textAnchor="middle" fontSize="11" fill="var(--text)">
            PostgreSQL (Neon)
          </text>
        </svg>
        <figcaption className={s.caption}>
          Luồng chính: yêu cầu từ trình duyệt → API ứng dụng → gọi nhà cung cấp AI → lưu/ghi nhận kết quả vào cơ sở dữ liệu khi cần.
        </figcaption>
      </figure>

      <h3 className={s.h3}>Luồng tạo đề (giáo viên)</h3>
      <figure className={s.fig}>
        <svg viewBox="0 0 640 120" className={s.svg} xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="36" width="100" height="44" rx="6" fill="var(--accent-light)" stroke="var(--border-strong)" />
          <text x="60" y="64" textAnchor="middle" fontSize="11">
            Form môn/lớp
          </text>
          <text x="130" y="62" fontSize="16">
            →
          </text>
          <rect x="150" y="36" width="110" height="44" rx="6" fill="var(--surface2)" stroke="var(--border-strong)" />
          <text x="205" y="58" textAnchor="middle" fontSize="10">
            buildExamPrompt()
          </text>
          <text x="205" y="72" textAnchor="middle" fontSize="10">
            + schema JSON
          </text>
          <text x="280" y="62" fontSize="16">
            →
          </text>
          <rect x="300" y="36" width="100" height="44" rx="6" fill="#fef3c7" stroke="#d97706" />
          <text x="350" y="62" textAnchor="middle" fontSize="10">
            Gemini / compat
          </text>
          <text x="420" y="62" fontSize="16">
            →
          </text>
          <rect x="440" y="36" width="90" height="44" rx="6" fill="var(--surface2)" stroke="var(--border-strong)" />
          <text x="485" y="62" textAnchor="middle" fontSize="10">
            Duyệt / sửa
          </text>
          <text x="545" y="62" fontSize="16">
            →
          </text>
          <rect x="560" y="36" width="70" height="44" rx="6" fill="#ecfdf5" stroke="#059669" />
          <text x="595" y="62" textAnchor="middle" fontSize="10">
            Lưu DB
          </text>
        </svg>
      </figure>

      <h3 className={s.h3}>Luồng nộp bài & nhận xét (học sinh)</h3>
      <figure className={s.fig}>
        <svg viewBox="0 0 640 100" className={s.svg} xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="30" width="90" height="40" rx="6" fill="var(--accent-light)" stroke="var(--border-strong)" />
          <text x="55" y="54" textAnchor="middle" fontSize="11">
            Làm bài
          </text>
          <text x="115" y="54" fontSize="16">
            →
          </text>
          <rect x="130" y="30" width="120" height="40" rx="6" fill="var(--surface2)" stroke="var(--border-strong)" />
          <text x="190" y="48" textAnchor="middle" fontSize="10">
            Chấm điểm cục bộ
          </text>
          <text x="190" y="62" textAnchor="middle" fontSize="10">
            (đáp án đề)
          </text>
          <text x="265" y="54" fontSize="16">
            →
          </text>
          <rect x="285" y="30" width="130" height="40" rx="6" fill="var(--surface2)" stroke="var(--border-strong)" />
          <text x="350" y="48" textAnchor="middle" fontSize="10">
            buildCommentPrompt()
          </text>
          <text x="350" y="62" textAnchor="middle" fontSize="10">
            (điểm, câu sai)
          </text>
          <text x="430" y="54" fontSize="16">
            →
          </text>
          <rect x="450" y="30" width="90" height="40" rx="6" fill="#fef3c7" stroke="#d97706" />
          <text x="495" y="54" textAnchor="middle" fontSize="10">
            Gemini / compat
          </text>
          <text x="555" y="54" fontSize="16">
            →
          </text>
          <rect x="570" y="30" width="60" height="40" rx="6" fill="#ecfdf5" stroke="#059669" />
          <text x="600" y="54" textAnchor="middle" fontSize="10">
            Lưu
          </text>
        </svg>
      </figure>

      <h3 className={s.h3}>Câu lệnh hệ thống (system) — trích ý</h3>
      <pre className={s.pre}>
        {`Bạn là trợ lý giáo dục chuyên tạo đề thi cho học sinh Việt Nam. Giữ nguyên dấu tiếng Việt.`}
      </pre>

      <h3 className={s.h3}>Ví dụ prompt tạo đề (rút gọn — đầy đủ trong mã nguồn)</h3>
      <pre className={s.pre}>
        {`Tạo đúng N câu trắc nghiệm 4 phương án (A–D), môn {subject}, khối {grade}, chủ đề "{topic}"...
Mức độ: {easy|medium|hard|mixed}...
Mỗi phần tử JSON gồm: question, options {A,B,C,D}, answer, explanation — chỉ trả về MẢNG JSON...`}
      </pre>

      <h3 className={s.h3}>Ví dụ prompt nhận xét sau khi nộp bài</h3>
      <pre className={s.pre}>
        {`Học sinh "{tên}" — {môn}: {điểm}/{tổng} câu đúng (%).
Câu sai gợi ý ôn: ...
Viết tối đa 2–3 câu tiếng Việt... (1) phần nắm chắc (2) phần cần ôn...`}
      </pre>
      <p className={s.note}>
        Chi tiết độ dài, LaTeX trong JSON và schema câu hỏi được định nghĩa trong <code>lib/gemini.ts</code> (hàm{' '}
        <code>buildExamPrompt</code>, <code>buildCommentPrompt</code>).
      </p>
    </div>
  )
}
