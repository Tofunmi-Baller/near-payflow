// ── Profile ──────────────────────────────────────────────

export interface Profile {
  id: number;
  business_name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  payout_wallet: string;
  settle_asset: string;
  default_terms_days: number;
  default_tax_rate: number;
  invoice_prefix: string;
  created_at: string;
  updated_at: string;
}

// ── Clients ──────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  country: string;
  city: string;
  created_at: string;
  // derived
  total_billed?: number;
  total_paid?: number;
  outstanding?: number;
  invoice_count?: number;
  last_invoice_date?: string;
}

// ── Invoices ─────────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type DerivedStatus = InvoiceStatus | "overdue" | "viewed";

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_email: string;
  description: string;
  notes: string;
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  terms_days: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  derived_status: DerivedStatus;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoicePayload {
  client_id: string;
  description: string;
  notes?: string;
  line_items: LineItem[];
  tax_rate: number;
  terms_days: number;
  due_date: string;
  currency: string;
  status?: "draft" | "sent";
}

// ── Payments ─────────────────────────────────────────────

export interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  amount_usd: number;
  token_in: string;
  amount_in: number;
  chain_in: string;
  token_out: string;
  amount_out: number;
  fee_usd: number;
  rate: number;
  payer_wallet: string;
  tx_hash: string;
  settle_seconds: number;
  simulated: boolean;
  created_at: string;
}

export interface PaymentResult {
  success: boolean;
  payment: Payment;
}

export interface PaymentQuote {
  invoice_id: string;
  token_in: string;
  amount_usd: number;
  amount_in: number;
  rate: number;
  fee_usd: number;
  settle_estimate_seconds: number;
  token_out: string;
  amount_out: number;
  expires_at: string;
}

// ── Events ───────────────────────────────────────────────

export type EventType =
  | "created"
  | "sent"
  | "viewed"
  | "reminder_sent"
  | "payment_started"
  | "paid"
  | "voided";

export interface InvoiceEvent {
  id: number;
  invoice_id: string;
  type: EventType;
  meta: string;
  created_at: string;
}

// ── Dashboard / Stats ────────────────────────────────────

export interface DashboardStats {
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_delta: number;
  outstanding_amount: number;
  outstanding_count: number;
  overdue_amount: number;
  overdue_count: number;
  avg_settle_seconds: number;
  total_revenue: number;
  total_invoices: number;
  paid_count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface NeedsAttention {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  due_date: string;
  derived_status: DerivedStatus;
  days_overdue?: number;
  viewed_at?: string;
}

export interface ActivityItem {
  id: number;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  type: EventType;
  meta: string;
  amount?: number;
  created_at: string;
}

// ── Reports ──────────────────────────────────────────────

export interface RevenueByClient {
  client_id: string;
  client_name: string;
  revenue: number;
}

export interface RevenueByToken {
  token: string;
  count: number;
  amount_usd: number;
}

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
}

// ── SSE ──────────────────────────────────────────────────

export interface SSEEvent {
  type: "invoice.viewed" | "payment.started" | "invoice.paid";
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  amount?: number;
  token?: string;
  timestamp: string;
}

// ── Tokens ───────────────────────────────────────────────

export interface TokenInfo {
  symbol: string;
  name: string;
  icon: string;
  chain: string;
  rate: number;
  color: string;
}
