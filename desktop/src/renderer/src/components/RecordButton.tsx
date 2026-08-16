import type { RecorderStatus } from "../hooks/useRecorder";

interface Props {
  status: RecorderStatus;
  onStart: () => void;
  onStop: () => void;
}

const LABELS: Record<RecorderStatus, string> = {
  idle: "● Grabar reunión",
  recording: "■ Detener y transcribir",
  processing: "Transcribiendo…",
  error: "Reintentar",
};

export function RecordButton({ status, onStart, onStop }: Props): JSX.Element {
  const isRecording = status === "recording";
  const isDisabled = status === "processing";

  return (
    <button
      className={`record-button ${isRecording ? "recording" : ""}`}
      disabled={isDisabled}
      onClick={isRecording ? onStop : onStart}
    >
      {LABELS[status]}
    </button>
  );
}
