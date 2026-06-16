import { useEffect, useState } from "react";
import type { Order, ReferenceData } from "./types/order";
import { api } from "./api/client";
import { OrderForm } from "./components/OrderForm";
import { OrdersList } from "./components/OrdersList";

type Tab = "form" | "submitted" | "parked";

export default function App() {
  const [tab, setTab] = useState<Tab>("form");
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api
      .getReferenceData()
      .then(setReferenceData)
      .catch(e => setLoadError(e instanceof Error ? e.message : "Failed to load reference data."));
  }, []);

  const handleSaved = (_order: Order, message: string) => {
    setToast(message);
    setRefreshKey(k => k + 1);
    window.setTimeout(() => setToast(null), 6000);
  };

  return (
    <div className="app">
      <nav className="tabs">
        <button className={tab === "form" ? "tab tab--active" : "tab"} onClick={() => setTab("form")}>
          New Order
        </button>
        <button className={tab === "submitted" ? "tab tab--active" : "tab"} onClick={() => setTab("submitted")}>
          Submitted Orders
        </button>
        <button className={tab === "parked" ? "tab tab--active" : "tab"} onClick={() => setTab("parked")}>
          Parked Orders
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}

      <main className="content">
        {loadError && <div className="banner banner--error">{loadError}</div>}

        {tab === "form" &&
          (referenceData
            ? <OrderForm referenceData={referenceData} onSaved={handleSaved} />
            : !loadError && <p className="muted">Loading form…</p>)}

        {tab === "submitted" && <OrdersList status="Submitted" refreshKey={refreshKey} />}
        {tab === "parked" && <OrdersList status="Parked" refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
