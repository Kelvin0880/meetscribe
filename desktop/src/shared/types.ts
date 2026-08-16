export type TranscriptStatus = "processing" | "summarized" | "error";

export interface TranscriptDto {
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

export interface ListTranscriptsParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ListTranscriptsResult {
  items: TranscriptDto[];
  total: number;
}

export interface StopAndTranscribePayload {
  title: string;
  wavBuffer: ArrayBuffer;
  audioDurationSeconds: number;
}
