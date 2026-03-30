/**
 * Bản mô tả dự án QuizAI — dùng chung cho trang web và xuất Word (.doc HTML).
 */

export type MoTaSection = {
  id: string
  title: string
  /** Đoạn văn; mỗi phần tử là một đoạn riêng */
  paragraphs: string[]
  /** Gạch đầu dòng (tùy chọn) */
  bullets?: string[]
}

export const MO_TA_META = {
  title: 'Bản mô tả dự án QuizAI',
  subtitle:
    'Ứng dụng web soạn đề trắc nghiệm, làm bài online, tích hợp AI (Gemini / tương thích OpenAI). Tài liệu mô tả mục tiêu, quy trình, pháp lý & nguồn mở, mô hình AI, prompt, luồng API và sơ đồ luồng dữ liệu.',
}

/** Đoạn chân trang trang công khai (có thể sửa trong /teacher/mo-ta-du-an/edit). */
export const MO_TA_FOOTER_NOTE =
  'Bản mô tả này tóm tắt chức năng đã triển khai trong phiên bản hiện tại của ứng dụng; chi tiết kỹ thuật có thể thay đổi theo từng đợt cập nhật mà không làm thay đổi mục tiêu giáo dục nêu trên.'

export type MoTaPayload = {
  meta: { title: string; subtitle: string }
  sections: MoTaSection[]
  footerNote: string
}

export const MO_TA_SECTIONS: MoTaSection[] = [
  {
    id: 'gioi-thieu',
    title: '1. Giới thiệu ngắn',
    paragraphs: [
      'QuizAI là một ứng dụng chạy trên trình duyệt (website), giúp giáo viên tạo đề kiểm tra trắc nghiệm nhanh hơn nhờ gợi ý nội dung từ máy tính thông minh (AI), đồng thời cho phép học sinh làm bài trực tuyến và nhận điểm cùng lời nhận xét ngay sau khi nộp bài. Hệ thống cũng hỗ trợ quản lý lớp, danh sách học sinh và gán đề cho từng lớp khi cần.',
      'Ứng dụng hướng tới việc giảm thời gian soạn đề thủ công, tăng tính cá nhân hóa phản hồi cho học sinh, và giúp nhà trường tập trung dữ liệu bài làm ở một nơi thay vì dùng nhiều công cụ rời rạc.',
    ],
  },
  {
    id: 'muc-tieu',
    title: '2. Mục tiêu',
    paragraphs: [
      'Dự án hướng tới các mục tiêu sau (diễn đạt gần với người không chuyên công nghệ):',
    ],
    bullets: [
      'Rút ngắn thời gian chuẩn bị đề kiểm tra phù hợp môn học, khối lớp và chủ đề dạy học.',
      'Cho phép học sinh làm bài qua đường link hoặc mã, không bắt buộc cài phần mềm; có thể giới hạn thời gian làm bài và số lần làm.',
      'Chấm điểm tự động theo đáp án đúng đã lưu, đồng thời tạo nhận xét ngắn gọn giúp học sinh hiểu điểm mạnh và phần cần củng cố.',
      'Hỗ trợ tổ chức theo lớp: thêm học sinh, nhập danh sách từ bảng tính (Excel/CSV), gán đề cho lớp và xem thống kê cơ bản.',
      'Phía hệ thống: dữ liệu lưu trên máy chủ; giáo viên luôn xem lại và chỉnh sửa nội dung do AI gợi ý trước khi lưu đề chính thức.',
    ],
  },
  {
    id: 'doi-tuong',
    title: '3. Đối tượng áp dụng',
    paragraphs: [
      'Giáo viên các cấp cần soạn đề trắc nghiệm nhanh, có thể chỉnh tay sau khi máy gợi ý.',
      'Học sinh làm bài tại nhà hoặc trên máy phòng lab qua trình duyệt.',
      'Người phụ trách lớp hoặc đầu khối cần quản lý danh sách lớp, nhập học sinh hàng loạt và theo dõi ai đã làm bài (tùy cấu hình đề).',
      'Tài khoản quản trị tối thiểu (trong bản triển khai) để tạo tài khoản phụ cho giáo viên hoặc người phụ trách lớp — không yêu cầu người dùng cuối hiểu về máy chủ hay cơ sở dữ liệu.',
    ],
  },
  {
    id: 'quy-trinh',
    title: '4. Quy trình thực hiện (theo vai trò)',
    paragraphs: [
      'Phía giáo viên: đăng nhập khu vực dành cho giáo viên → chọn môn, khối, chủ đề, số câu và mức độ → hệ thống gọi AI để sinh bản nháp câu hỏi → giáo viên đọc, sửa nếu cần → lưu đề → có thể chia sẻ link/mã cho học sinh hoặc gán đề cho một hoặc nhiều lớp đã tạo trên hệ thống.',
      'Phía học sinh: mở đường link làm bài hoặc nhập mã (nếu có) → làm trắc nghiệm trên màn hình → nộp bài → nhận điểm và đoạn nhận xét do AI soạn dựa trên kết quả (nếu dịch vụ AI hoạt động bình thường).',
      'Phía quản lý lớp: tạo lớp (tên, ghi chú), thêm học sinh từng người hoặc nhập file Excel/CSV; trước khi nhập hàng loạt, màn hình cho phép kiểm tra và sửa danh sách trong một bảng, chỉ khi xác nhận mới gửi lên hệ thống.',
      'Toàn bộ quy trình diễn ra trên web; không cần cài đặt ứng dụng riêng cho học sinh.',
    ],
  },
  {
    id: 'hieu-qua',
    title: '5. Hiệu quả và lợi ích',
    paragraphs: [
      'Tiết kiệm thời gian soạn ma trận câu hỏi ban đầu; giáo viên vẫn giữ quyền quyết định cuối cùng về nội dung.',
      'Học sinh nhận phản hồi nhanh, góp phần duy trì động lực; giáo viên có thể xem lại bài làm và nhận xét AI trong bảng điều khiển.',
      'Giảm sai sót chấm tay với đề trắc nghiệm chuẩn một đáp án; dữ liệu tập trung giúp theo dõi tiến độ theo lớp hoặc theo đề.',
      'Linh hoạt triển khai: có thể dùng cho ôn tập, kiểm tra 15 phút, hoặc bài tập về nhà tùy cách cấu hình thời gian và số lần làm.',
    ],
  },
  {
    id: 'mo-hinh-ai-va-du-lieu',
    title: '6. Mô hình AI, nguồn dữ liệu huấn luyện & cách triển khai',
    paragraphs: [
      'Ứng dụng không tự huấn luyện (fine-tune) mô hình trên bài làm hay danh sách học sinh của trường. Dữ liệu đề thi sau khi giáo viên lưu và kết quả học sinh được lưu trong cơ sở dữ liệu do đơn vị triển khai quản lý (PostgreSQL), phục vụ hiển thị và thống kê — không được mô tả ở đây như “dữ liệu huấn luyện” cho một mô hình riêng của trường.',
      'Mô hình ngôn ngữ được gọi qua API của nhà cung cấp thương mại / đám mây: mặc định Google Gemini (ví dụ biến thể gemini-2.5-flash, có thể đổi bằng biến môi trường GEMINI_MODEL). Có thể bật chế độ tương thích OpenAI (HTTP Chat Completions) qua OPENAI_COMPAT_* để dùng các dịch vụ hợp pháp khác (Groq, OpenRouter, Together, Ollama qua URL, v.v.).',
      'Các mô hình này đã được nhà phát triển huấn luyện trước trên tập dữ liệu tổng hợp theo chính sách của từng nhà cung cấp (xem tài liệu Google AI / đối tác tương ứng). QuizAI chỉ gửi prompt ngắn (môn, khối, chủ đề, số câu; hoặc điểm số và tóm tắt câu sai) qua HTTPS có khóa API — không công bố thêm “bộ dữ liệu huấn luyện nội bộ” vì không tồn tại trong phạm vi dự án.',
    ],
    bullets: [
      'Biến môi trường: GEMINI_API_KEY, GEMINI_MODEL; tùy chọn AI_PROVIDER, OPENAI_COMPAT_API_KEY, OPENAI_COMPAT_BASE_URL, OPENAI_COMPAT_MODEL.',
      'Hệ thống hướng dẫn (system) cố định: trợ lý giáo dục, giữ dấu tiếng Việt — xem mục sơ đồ & prompt mẫu.',
    ],
  },
  {
    id: 'phap-ly-nguon-mo',
    title: '7. Nguyên tắc pháp lý, nguồn mở & bản quyền',
    paragraphs: [
      'Ưu tiên dùng thư viện và framework có giấy phép rõ ràng, phù hợp nhúng trong sản phẩm: Next.js (MIT), React (MIT), KaTeX (MIT), thư viện đọc Excel (Apache-2.0), mã QR (MIT), driver cơ sở dữ liệu Neon serverless — người triển khai cần giữ file LICENSE / attribution theo từng gói trong node_modules khi phân phối.',
      'Nội dung đề do AI sinh ra phải được giáo viên rà soát trước khi sử dụng; trách nhiệm pháp lý đối với đề thi thuộc đơn vị sử dụng. Khóa API AI do đơn vị chủ quản cấp phát, tuân thủ điều khoản dịch vụ của Google / nhà cung cấp tương thích.',
    ],
    bullets: [
      'Font chữ (Be Vietnam Pro) qua Google Fonts — tuân bản quyền font và CSP khi triển khai production.',
      'Sơ đồ minh họa trên trang này do dự án tự vẽ (SVG), không lấy ảnh có bản quyền hạn chế.',
    ],
  },
  {
    id: 'quy-trinh-ai-chi-tiet',
    title: '8. Quy trình xử lý AI: prompt, API, xử lý thông tin',
    paragraphs: [
      'Tạo đề: giáo viên gửi biểu mẫu (môn, khối, chủ đề, độ khó, số câu…) tới API nội bộ POST /api/generate-exam. Máy chủ dựng prompt bằng hàm buildExamPrompt (lib/gemini.ts), kèm system instruction cố định; gọi Gemini JSON mode (schema mảng câu hỏi) hoặc fallback phân tích văn bản; chuẩn hóa cấu trúc câu hỏi (normalizeExamQuestions). Kết quả trả về trình duyệt — chưa ghi DB; giáo viên duyệt ở màn hình review rồi POST /api/save-exam mới lưu.',
      'Nộp bài: học sinh gửi đáp án tới POST /api/submit-result. Máy chủ nạp đề từ DB, so khớp đáp án để tính điểm cục bộ (không cần AI). Sau đó buildCommentPrompt (điểm, tên, gợi ý câu sai rút gọn) gọi callGemini để sinh đoạn nhận xét tiếng Việt; nếu hết quota API, vẫn lưu điểm và có thông báo thay cho nhận xét AI.',
      'Luồng HTTPS: trình duyệt ↔ máy chủ Next.js (cookie phiên giáo viên; API học sinh thường không cần đăng nhập tài khoản Google). Máy chủ ↔ nhà cung cấp AI chỉ qua API key trên biến môi trường, không nhúng khóa vào mã nguồn client.',
    ],
    bullets: [
      'Endpoint chính liên quan AI: POST /api/generate-exam, POST /api/submit-result (gọi AI trong route).',
      'Nhiệt độ (temperature) sinh đề ~0.45–0.55 tùy nhánh; nhận xét sau bài tương tự trong callGemini.',
    ],
  },
  {
    id: 'so-do-luong',
    title: '9. Sơ đồ luồng dữ liệu & ví dụ prompt',
    paragraphs: [
      'Phần dưới hiển thị sơ đồ SVG (trên trang web) và trích đoạn prompt mẫu; bản Word có thể rút gọn — nên xem trực tiếp trang này để có hình đầy đủ.',
    ],
  },
  {
    id: 'huong-phat-trien',
    title: '10. Hướng phát triển',
    paragraphs: [
      'Mở rộng ngân hàng dạng câu hỏi (ví dụ nhiều đáp án đúng, câu ghép đôi) và bộ lọc theo chuẩn đánh giá năng lực.',
      'Báo cáo chi tiết hơn cho từng học sinh theo thời gian: tiến bộ theo chủ đề, so sánh lớp.',
      'Tích hợp đăng nhập học sinh theo tài khoản nhà trường (nếu có) và đồng bộ lịch học.',
      'Tối ưu giao diện trên điện thoại và hỗ trợ ngoại tuyến một phần cho khu vực mạng không ổn định.',
      'Tiếp tục kiểm tra nội dung do AI sinh ra với chuyên gia môn học để đảm bảo độ chính xác và tính công bằng.',
    ],
  },
]

export function getDefaultMoTaPayload(): MoTaPayload {
  return {
    meta: { ...MO_TA_META },
    sections: MO_TA_SECTIONS.map(s => ({
      id: s.id,
      title: s.title,
      paragraphs: [...s.paragraphs],
      bullets: s.bullets ? [...s.bullets] : undefined,
    })),
    footerNote: MO_TA_FOOTER_NOTE,
  }
}

/**
 * Ghép mục đã lưu với bản mặc định: thứ tự theo bản mặc định; nội dung theo id nếu đã có trong DB;
 * thêm mục mới từ mặc định nếu thiếu; giữ thêm mục lạ (id không có trong mặc định) ở cuối.
 */
export function mergeMoTaWithDefaults(db: MoTaPayload): MoTaPayload {
  const def = getDefaultMoTaPayload()
  /** Mục id cũ đổi tên — bỏ để tránh trùng với mục mới. */
  const dbSections = db.sections.filter(s => s.id !== 'cong-cu-ai')
  const byId = new Map(dbSections.map(s => [s.id, s]))
  const merged: MoTaSection[] = []
  for (const s of def.sections) {
    merged.push(byId.get(s.id) ?? s)
  }
  const defIds = new Set(def.sections.map(s => s.id))
  for (const s of dbSections) {
    if (!defIds.has(s.id)) merged.push(s)
  }
  return { ...db, sections: merged }
}
