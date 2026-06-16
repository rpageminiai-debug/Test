import type { Order, OrderListItem, ReferenceData, ValidationErrorResponse } from "../types/order";

const BASE = "/api";

export class ApiValidationError extends Error {
  constructor(public response: ValidationErrorResponse) {
    super(response.message);
    this.name = "ApiValidationError";
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 422) {
    const body = (await res.json()) as ValidationErrorResponse;
    throw new ApiValidationError(body);
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${await res.text()}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const jsonHeaders = { "Content-Type": "application/json" };

export const api = {
  getReferenceData: () =>
    fetch(`${BASE}/reference-data`).then(r => handle<ReferenceData>(r)),

  listOrders: (status?: string) =>
    fetch(`${BASE}/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`)
      .then(r => handle<OrderListItem[]>(r)),

  getOrder: (id: number) =>
    fetch(`${BASE}/orders/${id}`).then(r => handle<Order>(r)),

  submitOrder: (order: Order) =>
    fetch(`${BASE}/orders/submit`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(order) })
      .then(r => handle<Order>(r)),

  parkOrder: (order: Order, reasonForParking?: string) =>
    fetch(`${BASE}/orders/park`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ order, reasonForParking })
    }).then(r => handle<Order>(r)),

  updateOrder: (id: number, order: Order) =>
    fetch(`${BASE}/orders/${id}`, { method: "PUT", headers: jsonHeaders, body: JSON.stringify(order) })
      .then(r => handle<Order>(r))
};
