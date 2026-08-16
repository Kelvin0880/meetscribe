import { useState } from "react";
import { RecordButton } from "../components/RecordButton";
import { StatusBanner } from "../components/StatusBanner";
import { useRecorder } from "../hooks/useRecorder";

export function RecordPage(): JSX.Element {
  const { status, errorMessage, start, stopAndSave } = useRecorder();
  const [title, setTitle] = useState("");

  const handleStop = async () => {
    const finalTitle = title.trim() || `Reunión ${new Date().toLocaleString()}`;
    const result = await stopAndSave(finalTitle);
    if (result) setTitle("");
  };

  return (
    <section className="record-page">
      <input
        className="title-input"
        placeholder="Título de la reunión (opcional)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={status === "recording" || status === "processing"}
      />
      <RecordButton status={status} onStart={start} onStop={handleStop} />
      {status === "recording" && <p className="hint">Grabando micrófono + audio del sistema…</p>}
      <StatusBanner message={errorMessage} />
    </section>
  );
}
