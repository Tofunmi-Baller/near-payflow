export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  freelancer_name: string;
  freelancer_email: string;
  freelancer_wallet: string;
  client_name: string;
  client_email: string;
  description: string;
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "overdue";
  payment_tx_hash: string | null;
  payment_timestamp: string | null;
  payment_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_invoices: number;
  total_revenue: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  recent_payments: {
    id: string;
    client_name: string;
    total: number;
    payment_timestamp: string;
  }[];
}

export interface CreateInvoicePayload {
  freelancer_name: string;
  freelancer_email: string;
  freelancer_wallet: string;
  client_name: string;
  client_email: string;
  description: string;
  line_items: LineItem[];
  tax_rate: number;
  due_date: string;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  tx_hash: string;
  timestamp: string;
  token_used: string;
  amount_paid: number;
  near_amount: string;
  block_height: number;
}
