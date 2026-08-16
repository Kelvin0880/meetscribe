import { useEffect, useState } from "react";
import { StatusBanner } from "../components/StatusBanner";
import { TranscriptCard } from "../components/TranscriptCard";
import type { TranscriptDto } from "../../../shared/types";

export function HistoryPage(): JSX.Element {
  const [items, setItems] = useState<TranscriptDto[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TranscriptDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (q?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await window.meetscribe.transcripts.list({ q, limit: 50, offset: 0 });
      setItems(result.items);
    } catch (err) {
      setErrorMessage((err as Error).message || "No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect = async (id: string) => {
    try {
      const transcript = await window.meetscribe.transcripts.get(id);
      setSelected(transcript);
    } catch (err) {
      setErrorMessage((err as Error).message || "No se pudo abrir el transcript");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.meetscribe.transcripts.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      setErrorMessage((err as Error).message || "No se pudo eliminar el transcript");
    }
  };

  return (
    <section className="history-page">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(query);
        }}
      >
        <input
          className="search-input"
          placeholder="Buscar en tus reuniones…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>

      <StatusBanner message={errorMessage} />

      {loading && <p className="hint">Cargando…</p>}
      {!loading && items.length === 0 && <p className="hint">Todavía no grabaste ninguna reunión.</p>}

      <div className="transcript-list">
        {items.map((item) => (
          <TranscriptCard key={item.id} transcript={item} onSelect={handleSelect} onDelete={handleDelete} />
        ))}
      </div>

      {selected && (
        <div className="transcript-detail">
          <h2>{selected.title}</h2>

          {selected.actionItems.length > 0 && (
            <>
              <h4>Acciones pendientes</h4>
              <ul>
                {selected.actionItems.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </>
          )}

          <h4>Transcript completo</h4>
          <pre className="transcript-text">{selected.transcriptText}</pre>
        </div>
      )}
    </section>
  );
}
