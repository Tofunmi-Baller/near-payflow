import type {
  Invoice,
  CreateInvoicePayload,
  PaymentResult,
  DashboardStats,
} from "../types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchInvoices(): Promise<Invoice[]> {
  return request<Invoice[]>("/api/invoices");
}

export function fetchInvoice(id: string): Promise<Invoice> {
  return request<Invoice>(`/api/invoices/${id}`);
}

export function createInvoice(data: CreateInvoicePayload): Promise<Invoice> {
  return request<Invoice>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateInvoiceStatus(
  id: string,
  status: string,
): Promise<Invoice> {
  return request<Invoice>(`/api/invoices/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function payInvoice(
  id: string,
  token: string,
  wallet: string,
): Promise<PaymentResult> {
  return request<PaymentResult>(`/api/invoices/${id}/pay`, {
    method: "POST",
    body: JSON.stringify({ token_used: token, wallet_address: wallet }),
  });
}

export function deleteInvoice(id: string): Promise<void> {
  return request<void>(`/api/invoices/${id}`, { method: "DELETE" });
}

export function fetchStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/api/stats");
}
