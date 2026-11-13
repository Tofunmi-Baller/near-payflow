import type {
  Profile,
  Client,
  Invoice,
  CreateInvoicePayload,
  Payment,
  PaymentResult,
  PaymentQuote,
  InvoiceEvent,
  DashboardStats,
  MonthlyRevenue,
  NeedsAttention,
  ActivityItem,
  RevenueByClient,
  RevenueByToken,
  AgingBucket,
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

function qs(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    (e): e is [string, string] => e[1] !== undefined && e[1] !== "",
  );
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// ── Profile ──────────────────────────────────────────────

export function fetchProfile(): Promise<Profile> {
  return request("/api/profile");
}

export function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return request("/api/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Clients ──────────────────────────────────────────────

export function fetchClients(): Promise<Client[]> {
  return request("/api/clients");
}

export function fetchClient(
  id: string,
): Promise<Client & { invoices: Invoice[] }> {
  return request(`/api/clients/${id}`);
}

export function createClient(
  data: Omit<Client, "id" | "created_at">,
): Promise<Client> {
  return request("/api/clients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Invoices ─────────────────────────────────────────────

export function fetchInvoices(params?: {
  status?: string;
  client_id?: string;
  q?: string;
  sort?: string;
}): Promise<Invoice[]> {
  return request("/api/invoices" + qs(params));
}

export function fetchInvoice(id: string): Promise<Invoice> {
  return request(`/api/invoices/${id}`);
}

export function createInvoice(data: CreateInvoicePayload): Promise<Invoice> {
  return request("/api/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateInvoice(
  id: string,
  data: Partial<CreateInvoicePayload>,
): Promise<Invoice> {
  return request(`/api/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function sendInvoice(id: string): Promise<Invoice> {
  return request(`/api/invoices/${id}/send`, { method: "POST" });
}

export function viewInvoice(id: string): Promise<void> {
  return request(`/api/invoices/${id}/view`, { method: "POST" });
}

export function remindInvoice(id: string): Promise<void> {
  return request(`/api/invoices/${id}/remind`, { method: "POST" });
}

export function voidInvoice(id: string): Promise<void> {
  return request(`/api/invoices/${id}/void`, { method: "POST" });
}

export function duplicateInvoice(id: string): Promise<Invoice> {
  return request(`/api/invoices/${id}/duplicate`, { method: "POST" });
}

export function deleteInvoice(id: string): Promise<void> {
  return request(`/api/invoices/${id}`, { method: "DELETE" });
}

export function fetchInvoiceEvents(id: string): Promise<InvoiceEvent[]> {
  return request(`/api/invoices/${id}/events`);
}

// ── Payments ─────────────────────────────────────────────

export function fetchPayments(): Promise<Payment[]> {
  return request("/api/payments");
}

export function fetchQuote(
  invoiceId: string,
  token: string,
): Promise<PaymentQuote> {
  return request(`/api/quote?invoice_id=${invoiceId}&token=${token}`);
}

export function payInvoice(
  id: string,
  token: string,
  wallet: string,
): Promise<PaymentResult> {
  return request(`/api/invoices/${id}/pay`, {
    method: "POST",
    body: JSON.stringify({ token_in: token, payer_wallet: wallet }),
  });
}

// ── Stats ────────────────────────────────────────────────

export function fetchStats(): Promise<DashboardStats> {
  return request("/api/stats");
}

export function fetchMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  return request("/api/stats/monthly-revenue");
}

export function fetchNeedsAttention(): Promise<NeedsAttention[]> {
  return request("/api/stats/needs-attention");
}

export function fetchActivity(): Promise<ActivityItem[]> {
  return request("/api/stats/activity");
}

// ── Reports ──────────────────────────────────────────────

export function fetchRevenueByClient(): Promise<RevenueByClient[]> {
  return request("/api/reports/revenue-by-client");
}

export function fetchRevenueByToken(): Promise<RevenueByToken[]> {
  return request("/api/reports/revenue-by-token");
}

export function fetchAging(): Promise<AgingBucket[]> {
  return request("/api/reports/aging");
}

// ── Demo ─────────────────────────────────────────────────

export function resetDemo(): Promise<void> {
  return request("/api/demo/reset", { method: "POST" });
}
