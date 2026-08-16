import { callOpenRouter } from "./openrouter.service";
import { logger } from "../utils/logger";

// Tope de caracteres por bloque enviado al modelo. Deja margen de sobra para
// modelos free con contexto limitado y evita mandar la reunión entera de un
// tirón cuando es larga.
const MAX_CHARS_PER_CHUNK = 12000;
const MAX_CHUNKS = 6; // tope duro para no disparar demasiadas llamadas en transcripts gigantes

export interface SummaryResult {
  summary: string;
  actionItems: string[];
}

const JSON_SYSTEM_PROMPT = `Sos un asistente que resume reuniones de trabajo. Respondé SIEMPRE con JSON válido y nada más (sin texto antes o después), con este formato exacto:
{"summary": "resumen breve en 3-6 oraciones", "action_items": ["accion 1", "accion 2"]}
Si no hay acciones pendientes, action_items debe ser un array vacío. No inventes información que no esté en el texto.`;

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function parseSummaryJson(raw: string): SummaryResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : raw.trim(),
      actionItems: Array.isArray(parsed.action_items)
        ? parsed.action_items.filter((item: unknown): item is string => typeof item === "string")
        : [],
    };
  } catch {
    // El modelo no devolvió JSON válido: no es un error fatal, se usa el texto crudo como resumen.
    return { summary: raw.trim(), actionItems: [] };
  }
}

/**
 * Genera resumen + acciones pendientes a partir del transcript completo.
 * Para transcripts cortos hace un único llamado (mínimo gasto de tokens).
 * Para transcripts largos hace un resumen parcial por bloque y después un
 * resumen final sobre esos parciales, en vez de mandar todo junto.
 */
export async function summarizeTranscript(transcriptText: string): Promise<SummaryResult> {
  const trimmed = transcriptText.trim();
  if (!trimmed) {
    return { summary: "", actionItems: [] };
  }

  const chunks = chunkText(trimmed, MAX_CHARS_PER_CHUNK).slice(0, MAX_CHUNKS);

  if (trimmed.length > MAX_CHARS_PER_CHUNK * MAX_CHUNKS) {
    logger.warn("transcript_truncated_for_summary", { originalLength: trimmed.length });
  }

  if (chunks.length === 1) {
    const raw = await callOpenRouter([
      { role: "system", content: JSON_SYSTEM_PROMPT },
      { role: "user", content: chunks[0] },
    ]);
    return parseSummaryJson(raw);
  }

  const partialSummaries: string[] = [];
  for (const chunk of chunks) {
    const raw = await callOpenRouter(
      [
        {
          role: "system",
          content: "Resumí este fragmento de una reunión en 2-4 oraciones, en texto plano, sin JSON.",
        },
        { role: "user", content: chunk },
      ],
      { maxTokens: 300 },
    );
    partialSummaries.push(raw.trim());
  }

  const combined = await callOpenRouter([
    { role: "system", content: JSON_SYSTEM_PROMPT },
    { role: "user", content: partialSummaries.join("\n\n") },
  ]);

  return parseSummaryJson(combined);
}
