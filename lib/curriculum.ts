/** Khối lớp Tiểu học + THCS + THPT (gợi ý chuyên đề CT mở rộng từ 6) */
export const GRADES_ALL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const

export const SUBJECTS_ALL = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'GDCD',
  'Tin học',
] as const

type Subject = (typeof SUBJECTS_ALL)[number]
type Grade = (typeof GRADES_ALL)[number]

/** Gợi ý chuyên đề theo môn + khối (rút gọn, có thể mở rộng) */
const SUBTOPICS: Partial<Record<Subject, Partial<Record<Grade, string[]>>>> = {
  Toán: {
    '1': ['Số đếm', 'Phép cộng, trừ trong phạm vi 10', 'Hình khối cơ bản'],
    '2': ['Bảng nhân', 'Đơn vị đo độ dài', 'Giờ, ngày'],
    '3': ['Phép nhân, chia', 'Phân số cơ bản', 'Chu vi, diện tích'],
    '4': ['Phân số', 'Tỉ số', 'Hình tam giác, tứ giác'],
    '5': ['Phân số — Số thập phân', 'Diện tích hình tam giác', 'Thể tích'],
    '6': ['Số tự nhiên', 'Phân số', 'Số thập phân', 'Một số yếu tố thống kê'],
    '7': ['Số hữu tỉ', 'Hàm số và đồ thị', 'Thống kê'],
    '8': ['Đa thức', 'Phân thức đại số', 'Tam giác đồng dạng'],
    '9': ['Hệ thức lượng trong tam giác', 'Đường tròn', 'Hàm số y = ax²'],
    '10': ['Mệnh đề và tập hợp', 'Hàm số bậc hai', 'Tam giác', 'Vector'],
    '11': ['Dãy số', 'Tổ hợp', 'Lượng giác', 'Không gian'],
    '12': ['Ứng dụng đạo hàm', 'Nguyên hàm — Tích phân', 'Xác suất'],
  },
  'Ngữ văn': {
    '6': ['Văn bản truyện', 'Viết đoạn văn', 'Ngữ pháp'],
    '7': ['Văn miêu tả', 'Văn kể chuyện'],
    '8': ['Văn tự sự', 'Văn thuyết minh'],
    '9': ['Văn nghị luận', 'Văn bản thơ'],
    '10': ['Văn học trung đại', 'Nghị luận xã hội'],
    '11': ['Văn học hiện đại', 'Nghị luận văn học'],
    '12': ['Ôn tập tổng hợp', 'Nghị luận văn học'],
  },
  'Tiếng Anh': {
    '6': ['Family & friends', 'Daily routines', 'Grammar: Present simple'],
    '7': ['Past simple', 'Hobbies', 'Places'],
    '8': ['Future forms', 'Comparisons', 'Environment'],
    '9': ['Passive voice', 'Conditional type 1', 'Travel'],
    '10': ['Tenses review', 'Reported speech', 'Education'],
    '11': ['Conditional type 2/3', 'Word formation', 'Media'],
    '12': ['IELTS-style reading', 'Formal letter', 'Environment & society'],
  },
  'Vật lí': {
    '6': ['Âm học', 'Quang học', 'Điện học cơ bản'],
    '7': ['Chuyển động', 'Lực', 'Áp suất'],
    '8': ['Cơ năng', 'Nhiệt học'],
    '9': ['Điện học', 'Quang học hình'],
    '10': ['Động học', 'Định luật Newton', 'Năng lượng'],
    '11': ['Dao động', 'Sóng', 'Điện xoay chiều'],
    '12': ['Dao động cơ', 'Sóng ánh sáng', 'Lượng tử ánh sáng'],
  },
  'Hóa học': {
    '8': ['Chất — Nguyên tử — Phân tử', 'Phản ứng hóa học'],
    '9': ['Oxi — Không khí', 'Hiđro — Nước', 'Dung dịch'],
    '10': ['Cấu tạo nguyên tử', 'Bảng tuần hoàn', 'Liên kết hóa học'],
    '11': ['Ankan — Anken — Ankin', 'Ancol — Phenol', 'Andehit — Axit cacboxylic'],
    '12': ['Este — Lipit', 'Amino axit — Protein', 'Polime'],
  },
  'Sinh học': {
    '6': ['Thực vật', 'Động vật', 'Sinh thái học'],
    '7': ['Cơ thể người', 'Truyền nhiễm'],
    '8': ['Di truyền cơ bản', 'Biến dị'],
    '9': ['Sinh sản', 'Di truyền học Mendel'],
    '10': ['Tế bào', 'Trao đổi chất', 'Di truyền'],
    '11': ['Di truyền học', 'Tiến hóa', 'Sinh thái'],
    '12': ['Di truyền tế bào', 'Công nghệ gen', 'Sinh thái'],
  },
  'Lịch sử': {
    '6': ['Lịch sử thế giới cổ đại', 'Lịch sử Việt Nam thời cổ'],
    '7': ['Thế giới trung đại', 'Việt Nam thời Lý — Trần'],
    '8': ['Cách mạng Pháp', 'Việt Nam thế kỷ XIX'],
    '9': ['Chiến tranh thế giới', 'Việt Nam 1945–1975'],
    '10': ['Lịch sử thế giới hiện đại', 'Việt Nam 1858–1945'],
    '11': ['Lịch sử Việt Nam 1945–2000'],
    '12': ['Ôn tập tổng hợp'],
  },
  'Địa lí': {
    '6': ['Trái Đất', 'Bản đồ'],
    '7': ['Châu Á', 'Việt Nam tự nhiên'],
    '8': ['Dân cư', 'Kinh tế'],
    '9': ['Tài nguyên', 'Môi trường'],
    '10': ['Địa lí tự nhiên', 'Dân số'],
    '11': ['Kinh tế địa phương', 'Địa lí các vùng'],
    '12': ['Địa lí Việt Nam', 'Địa lí thế giới'],
  },
  GDCD: {
    '6': ['Bản thân và các mối quan hệ', 'Gia đình'],
    '7': ['Trường học', 'Bạn bè'],
    '8': ['Công dân với pháp luật'],
    '9': ['Phát triển bản thân'],
    '10': ['Pháp luật và đời sống'],
    '11': ['Kinh tế và pháp luật'],
    '12': ['Công dân với các vấn đề toàn cầu'],
  },
  'Tin học': {
    '6': ['Máy tính và em', 'An toàn thông tin'],
    '7': ['Thuật toán', 'Lập trình Scratch'],
    '8': ['Lập trình Python cơ bản'],
    '9': ['Cấu trúc dữ liệu đơn giản'],
    '10': ['Tin học đại cương', 'Thuật toán'],
    '11': ['Lập trình hướng đối tượng'],
    '12': ['Cơ sở dữ liệu', 'Mạng máy tính'],
  },
}

export function getSubtopics(subject: string, grade: string): string[] {
  if (!subject || !grade) return []
  const bySubject = SUBTOPICS[subject as Subject]
  if (!bySubject) return []
  const list = bySubject[grade as Grade]
  return list ? [...list] : []
}
