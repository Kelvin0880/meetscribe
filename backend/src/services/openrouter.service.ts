import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Wrapper de bajo nivel sobre la API de chat completions de OpenRouter.
 * Centraliza timeout, manejo de errores y headers acá para que el resto del
 * código nunca hable con `fetch` directamente.
 */
export async function callOpenRouter(messages: ChatMessage[], options: CallOptions = {}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.OPENROUTER_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.APP_URL ?? "https://meetscribe.local",
        "X-Title": "MeetScribe",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 800,
        temperature: options.temperature ?? 0.3,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      logger.error("openrouter_request_failed", { status: res.status, body: errorBody.slice(0, 500) });
      throw new AppError(`OpenRouter respondió con error (${res.status})`, 502);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger.error("openrouter_empty_response", { raw: JSON.stringify(data).slice(0, 500) });
      throw new AppError("OpenRouter no devolvió contenido", 502);
    }

    return content;
  } catch (err) {
    if (err instanceof AppError) throw err;

    if ((err as Error).name === "AbortError") {
      throw new AppError("Tiempo de espera agotado llamando a OpenRouter", 504);
    }

    logger.error("openrouter_unexpected_error", { message: (err as Error).message });
    throw new AppError("Error inesperado llamando a OpenRouter", 502);
  } finally {
    clearTimeout(timeout);
  }
}
