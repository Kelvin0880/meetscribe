import { randomUUID } from "node:crypto";
import { pool } from "../db/pool";
import { summarizeTranscript } from "./summary.service";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export interface CreateTranscriptInput {
  title: string;
  transcriptText: string;
  audioDurationSeconds?: number;
}

export type TranscriptStatus = "processing" | "summarized" | "error";

export interface Transcript {
  id: string;
  title: string;
  transcriptText: string;
  summary: string | null;
  actionItems: string[];
  status: TranscriptStatus;
  errorMessage: string | null;
  audioDurationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Transcript {
  return {
    id: row.id,
    title: row.title,
    transcriptText: row.transcript_text,
    summary: row.summary,
    actionItems: row.action_items ?? [],
    status: row.status,
    errorMessage: row.error_message,
    audioDurationSeconds: row.audio_duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Crea el transcript y dispara el resumen por IA. Si el resumen falla
 * (OpenRouter caído, rate limit, etc.) el transcript igual queda guardado
 * con status "error" — nunca se pierde el texto original por un fallo del
 * modelo, y el cliente puede reintentar el resumen más adelante.
 */
export async function createTranscript(input: CreateTranscriptInput): Promise<Transcript> {
  const id = randomUUID();

  const insertResult = await pool.query(
    `INSERT INTO transcripts (id, title, transcript_text, status, audio_duration_seconds)
     VALUES ($1, $2, $3, 'processing', $4)
     RETURNING *`,
    [id, input.title, input.transcriptText, input.audioDurationSeconds ?? null],
  );

  try {
    const { summary, actionItems } = await summarizeTranscript(input.transcriptText);
    const updateResult = await pool.query(
      `UPDATE transcripts
       SET summary = $1, action_items = $2::jsonb, status = 'summarized', updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [summary, JSON.stringify(actionItems), id],
    );
    return mapRow(updateResult.rows[0]);
  } catch (err) {
    logger.error("summary_generation_failed", { transcriptId: id, message: (err as Error).message });
    const errorResult = await pool.query(
      `UPDATE transcripts
       SET status = 'error', error_message = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [(err as Error).message.slice(0, 500), id],
    );
    return mapRow(errorResult.rows[0]);
  }

  // Nota: la fila insertada arriba ya sirve de fallback; si algo falla antes
  // de llegar a los UPDATE, TypeScript exige un valor de retorno en todos
  // los caminos, por eso ambos bloques del try/catch devuelven explícitamente.
}

export interface ListTranscriptsParams {
  search?: string;
  limit: number;
  offset: number;
}

export async function listTranscripts(
  params: ListTranscriptsParams,
): Promise<{ items: Transcript[]; total: number }> {
  const { search, limit, offset } = params;
  const whereClause = search ? "WHERE search_vector @@ plainto_tsquery('simple', $1)" : "";

  const itemsResult = await pool.query(
    `SELECT * FROM transcripts ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${search ? "$2" : "$1"} OFFSET ${search ? "$3" : "$2"}`,
    search ? [search, limit, offset] : [limit, offset],
  );

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM transcripts ${whereClause}`,
    search ? [search] : [],
  );

  return { items: itemsResult.rows.map(mapRow), total: countResult.rows[0].total };
}

export async function getTranscriptById(id: string): Promise<Transcript> {
  const result = await pool.query("SELECT * FROM transcripts WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    throw new AppError("Transcript no encontrado", 404);
  }
  return mapRow(result.rows[0]);
}

export async function deleteTranscript(id: string): Promise<void> {
  const result = await pool.query("DELETE FROM transcripts WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    throw new AppError("Transcript no encontrado", 404);
  }
}
