import type { TranscriptDto } from "../../../shared/types";

interface Props {
  transcript: TranscriptDto;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_LABELS: Record<TranscriptDto["status"], string> = {
  processing: "Procesando…",
  summarized: "Listo",
  error: "Error al resumir",
};

export function TranscriptCard({ transcript, onSelect, onDelete }: Props): JSX.Element {
  return (
    <div className="transcript-card">
      <div className="transcript-card-header" onClick={() => onSelect(transcript.id)}>
        <h3>{transcript.title}</h3>
        <span className={`status-pill ${transcript.status}`}>{STATUS_LABELS[transcript.status]}</span>
      </div>
      <p className="transcript-summary">{transcript.summary ?? "Resumen no disponible todavía."}</p>
      <button
        className="link-button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(transcript.id);
        }}
      >
        Eliminar
      </button>
    </div>
  );
}
