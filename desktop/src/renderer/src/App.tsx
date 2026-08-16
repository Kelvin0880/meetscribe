import { useState } from "react";
import { HistoryPage } from "./pages/HistoryPage";
import { RecordPage } from "./pages/RecordPage";

type Tab = "record" | "history";

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>("record");

  return (
    <div className="app">
      <nav className="tabs">
        <button className={tab === "record" ? "active" : ""} onClick={() => setTab("record")}>
          Grabar
        </button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>
          Historial
        </button>
      </nav>
      {tab === "record" ? <RecordPage /> : <HistoryPage />}
    </div>
  );
}
