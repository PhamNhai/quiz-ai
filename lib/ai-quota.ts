/** Thông báo khi 429 / hết quota — dùng chung Gemini & API tương thích OpenAI. */
export const AI_QUOTA_MESSAGE_VI =
  'Đã hết hạn mức gọi AI. Gói miễn phí thường có giới hạn — vui lòng thử lại sau, đổi API key, hoặc nâng gói tại nhà cung cấp (Google AI Studio, Groq, OpenRouter…).'

/** @deprecated dùng AI_QUOTA_MESSAGE_VI */
export const GEMINI_QUOTA_MESSAGE_VI = AI_QUOTA_MESSAGE_VI

export function isGeminiQuotaError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : ''
  if (!msg) return false
  if (msg === AI_QUOTA_MESSAGE_VI) return true
  return /429|RESOURCE_EXHAUSTED|exceeded your current quota|Quota exceeded|rate limit|too many requests/i.test(
    msg
  )
}
