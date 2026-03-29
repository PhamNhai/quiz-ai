import { AI_QUOTA_MESSAGE_VI } from './ai-quota'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function throwOpenAICompatError(res: Response, errBody: unknown): never {
  const raw =
    typeof errBody === 'object' && errBody !== null ? JSON.stringify(errBody) : String(errBody)
  if (res.status === 429) throw new Error(AI_QUOTA_MESSAGE_VI)
  if (res.status === 403 && /quota|rate|limit|exceeded/i.test(raw)) throw new Error(AI_QUOTA_MESSAGE_VI)
  throw new Error(`OpenAI-compatible API ${res.status}: ${raw}`)
}

/**
 * Chat Completions (OpenAI format). Dùng với Groq, OpenRouter, Together, Ollama (qua base URL), v.v.
 */
export async function callOpenAICompatChat(
  messages: ChatMessage[],
  opts?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  const base = (process.env.OPENAI_COMPAT_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(
    /\/$/,
    ''
  )
  const key = process.env.OPENAI_COMPAT_API_KEY
  if (!key) throw new Error('Thiếu OPENAI_COMPAT_API_KEY (khi AI_PROVIDER=openai_compat)')

  const model = process.env.OPENAI_COMPAT_MODEL ?? 'llama-3.1-8b-instant'

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts?.temperature ?? 0.5,
      max_tokens: opts?.max_tokens ?? 8192,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throwOpenAICompatError(res, err)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[]
  }
  return data.choices?.[0]?.message?.content ?? ''
}
