# QuizAI — Hướng dẫn Deploy lên Vercel

## Stack
- **Frontend + Backend**: Next.js 14 (App Router)  
- **AI**: Google Gemini 1.5 Flash (miễn phí)  
- **Database**: Neon PostgreSQL (miễn phí)  
- **Hosting**: Vercel (miễn phí)  
- **Tổng chi phí: 0đ**

---

## BƯỚC 1 — Lấy Gemini API Key (miễn phí)

1. Vào https://aistudio.google.com/app/apikey
2. Đăng nhập Gmail
3. Bấm **Create API key** → **Create API key in new project**
4. Copy chuỗi `AIza...`

---

## BƯỚC 2 — Lấy Neon Database URL (miễn phí)

1. Vào https://neon.tech → **Sign up** (dùng GitHub hoặc Gmail)
2. **New Project** → đặt tên bất kỳ → **Create**
3. Vào **Dashboard** → **Connection Details**
4. Chọn tab **Pooled connection** → copy chuỗi `postgresql://...`

---

## BƯỚC 3 — Deploy lên Vercel

### Cách nhanh nhất: Vercel CLI
```bash
# Cài Vercel CLI (1 lần)
npm i -g vercel

# Vào thư mục project
cd quiz-ai
npm install

# Deploy lần đầu (làm theo hướng dẫn hiện ra)
vercel

# Thêm 2 biến môi trường
vercel env add GEMINI_API_KEY    # paste key Gemini
vercel env add DATABASE_URL      # paste chuỗi Neon

# Deploy production
vercel --prod
```

### Cách kéo thả: GitHub + Vercel
1. Push code lên GitHub (repo private ok)
2. Vào https://vercel.com → **Add New Project** → Import repo
3. Mở **Environment Variables**, thêm:
   - `GEMINI_API_KEY` = `AIza...`
   - `DATABASE_URL` = `postgresql://...`
4. Bấm **Deploy** → đợi 1-2 phút là có link

---

## Chạy local để test

```bash
cp .env.example .env.local
# Mở .env.local, điền GEMINI_API_KEY và DATABASE_URL

npm install
npm run dev
# Mở http://localhost:3000
```

---

## Cấu trúc project
```
quiz-ai/
├── app/
│   ├── page.tsx                  ← Trang chủ
│   ├── teacher/page.tsx          ← Giáo viên tạo đề
│   ├── teacher/success/page.tsx  ← Hiện link chia sẻ
│   ├── exam/page.tsx             ← Học sinh nhập tên + mã đề
│   ├── exam/[id]/page.tsx        ← Trang làm bài
│   ├── result/[id]/page.tsx      ← Kết quả + AI nhận xét
│   └── api/
│       ├── generate-exam/        ← Gọi Gemini tạo câu hỏi
│       ├── exams/[id]/           ← Lấy đề theo ID
│       └── submit-result/        ← Chấm bài + AI nhận xét
└── lib/
    ├── gemini.ts                 ← Wrapper gọi Gemini API
    └── db.ts                     ← Kết nối Neon PostgreSQL
```

## Lưu ý
- Database tự tạo bảng lần đầu — không cần chạy SQL thủ công
- Tạo đề mất 10-20 giây (Gemini đang xử lý)
- Gemini free tier: 15 requests/phút, 1500 requests/ngày — quá dư cho demo
