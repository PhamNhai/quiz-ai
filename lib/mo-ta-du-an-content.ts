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
  subtitle: 'Ứng dụng web hỗ trợ soạn đề trắc nghiệm và theo dõi kết quả học tập có hỗ trợ trí tuệ nhân tạo',
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
    id: 'cong-cu-ai',
    title: '6. Công cụ AI sử dụng (diễn giải đơn giản)',
    paragraphs: [
      'Hệ thống dùng các mô hình ngôn ngữ lớn (LLM) thông qua giao diện lập trình do bên cung cấp AI cấp phép (ví dụ Google Gemini; có thể cấu hình thêm dịch vụ tương thích OpenAI khi cần dự phòng).',
      'Hai chỗ chính AI tham gia: (1) Sinh bộ câu hỏi trắc nghiệm có bốn phương án, đáp án và hướng dẫn giải thích ngắn — phù hợp chương trình phổ thông Việt Nam theo thông tin giáo viên nhập; (2) Sau khi học sinh nộp bài, AI đọc điểm số và danh sách câu sai (ở mức tóm tắt) để viết một đoạn nhận xét động viên và gợi ý ôn tập — không thay thế hoàn toàn nhận xét của giáo viên.',
      'Nếu hết hạn mức gọi AI hoặc lỗi kết nối, đề vẫn có thể được soạn tay; điểm số vẫn được lưu, phần nhận xét tự động có thể tạm thiếu hoặc thông báo rõ ràng cho người dùng.',
    ],
  },
  {
    id: 'huong-phat-trien',
    title: '7. Hướng phát triển',
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
