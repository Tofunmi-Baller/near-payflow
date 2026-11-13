import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import db from "./db.ts";

const app = express();
const PORT = 3456;

app.use(cors());
app.use(express.json());

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

function parseLineItems(raw: string): LineItem[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function checkOverdue(invoice: Record<string, unknown>): Record<string, unknown> {
  if (invoice.status === "sent" && typeof invoice.due_date === "string") {
    const due = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      db.prepare("UPDATE invoices SET status = 'overdue', updated_at = ? WHERE id = ?").run(
        new Date().toISOString(),
        invoice.id
      );
      return { ...invoice, status: "overdue" };
    }
  }
  return invoice;
}

function formatInvoice(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row, line_items: parseLineItems(row.line_items as string) };
}

// Create invoice
app.post("/api/invoices", (req, res) => {
  try {
    const {
      freelancer_name,
      freelancer_email,
      freelancer_wallet,
      client_name,
      client_email,
      description,
      line_items,
      tax_rate,
      due_date,
      currency,
    } = req.body;

    if (!freelancer_name || !client_name || !line_items?.length || !due_date) {
      res.status(400).json({ error: "Missing required fields: freelancer_name, client_name, line_items, due_date" });
      return;
    }

    const id = nanoid(12);
    const now = new Date().toISOString();
    const subtotal = (line_items as LineItem[]).reduce(
      (sum: number, item: LineItem) => sum + item.quantity * item.rate,
      0
    );
    const effectiveTaxRate = tax_rate ?? 0;
    const tax_amount = Math.round(subtotal * effectiveTaxRate) / 100;
    const total = subtotal + tax_amount;

    const stmt = db.prepare(`
      INSERT INTO invoices (
        id, freelancer_name, freelancer_email, freelancer_wallet,
        client_name, client_email, description, line_items,
        subtotal, tax_rate, tax_amount, total, currency,
        due_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)
    `);

    stmt.run(
      id,
      freelancer_name,
      freelancer_email || "",
      freelancer_wallet || "",
      client_name,
      client_email || "",
      description || "",
      JSON.stringify(line_items),
      subtotal,
      effectiveTaxRate,
      tax_amount,
      total,
      currency || "USD",
      due_date,
      now,
      now
    );

    const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    res.status(201).json(formatInvoice(invoice as Record<string, unknown>));
  } catch (err) {
    console.error("POST /api/invoices error:", err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// List all invoices
app.get("/api/invoices", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM invoices ORDER BY created_at DESC").all() as Record<string, unknown>[];
    const invoices = rows.map((row) => formatInvoice(checkOverdue(row)));
    res.json(invoices);
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get single invoice
app.get("/api/invoices/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json(formatInvoice(checkOverdue(row)));
  } catch (err) {
    console.error("GET /api/invoices/:id error:", err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Update invoice status
app.patch("/api/invoices/:id/status", (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["draft", "sent", "paid", "overdue"].includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be: draft, sent, paid, overdue" });
      return;
    }

    const existing = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    db.prepare("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?").run(
      status,
      new Date().toISOString(),
      req.params.id
    );

    const updated = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id);
    res.json(formatInvoice(updated as Record<string, unknown>));
  } catch (err) {
    console.error("PATCH /api/invoices/:id/status error:", err);
    res.status(500).json({ error: "Failed to update invoice status" });
  }
});

// Pay invoice (simulation for demo)
app.post("/api/invoices/:id/pay", (req, res) => {
  try {
    const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    if (invoice.status === "paid") {
      res.status(400).json({ error: "Invoice is already paid" });
      return;
    }

    const { token_used = "USDC" } = req.body;
    const txHash = nanoid(44);
    const timestamp = new Date().toISOString();
    const total = invoice.total as number;
    const nearPrice = 6.42 + Math.random() * 0.3;
    const nearAmount = (total / nearPrice).toFixed(4);
    const blockHeight = 140_000_000 + Math.floor(Math.random() * 5_000_000);

    db.prepare(`
      UPDATE invoices
      SET status = 'paid',
          payment_tx_hash = ?,
          payment_timestamp = ?,
          payment_token = ?,
          updated_at = ?
      WHERE id = ?
    `).run(txHash, timestamp, token_used, timestamp, req.params.id);

    res.json({
      success: true,
      tx_hash: txHash,
      timestamp,
      token_used,
      amount_paid: total,
      near_amount: nearAmount,
      block_height: blockHeight,
    });
  } catch (err) {
    console.error("POST /api/invoices/:id/pay error:", err);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

// Dashboard stats
app.get("/api/stats", (_req, res) => {
  try {
    const totalInvoices = (db.prepare("SELECT COUNT(*) as count FROM invoices").get() as { count: number }).count;
    const totalRevenue = (
      db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM invoices WHERE status = 'paid'").get() as { sum: number }
    ).sum;
    const paidCount = (
      db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'paid'").get() as { count: number }
    ).count;
    const pendingCount = (
      db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'sent'").get() as { count: number }
    ).count;
    const overdueCount = (
      db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'overdue'").get() as { count: number }
    ).count;

    const recentPayments = db
      .prepare(
        "SELECT id, client_name, total, payment_timestamp FROM invoices WHERE status = 'paid' ORDER BY payment_timestamp DESC LIMIT 5"
      )
      .all();

    res.json({
      total_invoices: totalInvoices,
      total_revenue: totalRevenue,
      paid_count: paidCount,
      pending_count: pendingCount,
      overdue_count: overdueCount,
      recent_payments: recentPayments,
    });
  } catch (err) {
    console.error("GET /api/stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Delete invoice
app.delete("/api/invoices/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    db.prepare("DELETE FROM invoices WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/invoices/:id error:", err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

app.listen(PORT, () => {
  console.log(`PayFlow API server running on http://localhost:${PORT}`);
});
