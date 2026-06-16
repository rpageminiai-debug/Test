import { useEffect, useState } from "react";
import type { OrderListItem } from "../types/order";
import { api } from "../api/client";

interface Props {
  status: "Submitted" | "Parked";
  refreshKey: number;
}

export function OrdersList({ status, refreshKey }: Props) {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listOrders(status)
      .then(data => { if (!cancelled) { setItems(data); setError(null); } })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orders."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, refreshKey]);

  if (loading) return <p className="muted">Loading {status.toLowerCase()} orders…</p>;
  if (error) return <p className="banner banner--error">{error}</p>;
  if (items.length === 0) return <p className="muted">No {status.toLowerCase()} orders yet.</p>;

  return (
    <table className="orders-table">
      <thead>
        <tr>
          <th>FB #</th>
          <th>Shipper</th>
          <th>Consignee</th>
          <th>Service Level</th>
          <th>Payment</th>
          {status === "Parked" && <th>Reason Parked</th>}
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {items.map(o => (
          <tr key={o.id}>
            <td>{o.freightBillNumber ?? "—"}</td>
            <td>{o.shipperName ?? "—"}</td>
            <td>{o.consigneeName ?? "—"}</td>
            <td>{o.serviceLevel ?? "—"}</td>
            <td>{o.paymentType ?? "—"}</td>
            {status === "Parked" && <td>{o.reasonForParking ?? "—"}</td>}
            <td>{new Date(o.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
