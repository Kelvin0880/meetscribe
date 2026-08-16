import { env } from "../config/env";
import { logger } from "../utils/logger";
import type {
  ListTranscriptsParams,
  ListTranscriptsResult,
  TranscriptDto,
} from "../../shared/types";

/**
 * Único punto de contacto con el backend en Render. Todo el resto de la app
 * de escritorio habla con "el backend" a través de estas funciones, nunca
 * con `fetch` directo — así el manejo de errores queda en un solo lugar.
 */
async function request<T>(pathname: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.MEETSCRIBE_BACKEND_URL}${pathname}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (err) {
    logger.error("backend_request_network_error", { pathname, message: (err as Error).message });
    throw new Error("No se pudo conectar con el backend. Revisá tu conexión a internet.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    const message = body?.error?.message ?? `El backend respondió con error (${res.status})`;
    logger.error("backend_request_failed", { pathname, status: res.status, message });
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function createTranscript(input: {
  title: string;
  transcriptText: string;
  audioDurationSeconds?: number;
}): Promise<TranscriptDto> {
  return request<TranscriptDto>("/api/transcripts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listTranscripts(params: ListTranscriptsParams): Promise<ListTranscriptsResult> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return request<ListTranscriptsResult>(`/api/transcripts?${search.toString()}`);
}

export function getTranscript(id: string): Promise<TranscriptDto> {
  return request<TranscriptDto>(`/api/transcripts/${id}`);
}

export function deleteTranscript(id: string): Promise<void> {
  return request<void>(`/api/transcripts/${id}`, { method: "DELETE" });
}
