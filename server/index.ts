import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import db from "./db.ts";
import { seed, resetDemo } from "./seed.ts";
import { broadcast, setupSSE } from "./events.ts";

const app = express();
const PORT = 3456;

app.use(cors());
app.use(express.json());
setupSSE(app);

// ── Helpers ──────────────────────────────────────────────

function deriveStatus(row: Record<string, unknown>): string {
  const status = row.status as string;
  if (status === "paid" || status === "void" || status === "draft") return status;
  // status === "sent"
  const dueDate = new Date(row.due_date as string);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = dueDate < today;
  if (isOverdue) return "overdue";
  if (row.viewed_at) return "viewed";
  return "sent";
}

function formatInvoice(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    line_items: typeof row.line_items === "string" ? JSON.parse(row.line_items as string) : row.line_items,
    derived_status: deriveStatus(row),
  };
}

function nextInvoiceNumber(): string {
  const profile = db.prepare("SELECT invoice_prefix FROM profile WHERE id = 1").get() as { invoice_prefix: string } | undefined;
  const prefix = profile?.invoice_prefix || "INV";
  const max = db.prepare("SELECT invoice_number FROM invoices ORDER BY invoice_number DESC LIMIT 1").get() as { invoice_number: string } | undefined;
  if (!max) return `${prefix}-0001`;
  const num = parseInt(max.invoice_number.replace(/\D/g, ""), 10) + 1;
  return `${prefix}-${String(num).padStart(4, "0")}`;
}

// ── Profile ──────────────────────────────────────────────

app.get("/api/profile", (_req, res) => {
  const row = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  if (!row) return res.status(404).json({ error: "Profile not found" });
  res.json(row);
});

app.put("/api/profile", (req, res) => {
  const { business_name, email, address, city, country, payout_wallet, settle_asset, default_terms_days, default_tax_rate, invoice_prefix } = req.body;
  db.prepare(`
    UPDATE profile SET business_name=?, email=?, address=?, city=?, country=?, payout_wallet=?, settle_asset=?, default_terms_days=?, default_tax_rate=?, invoice_prefix=?, updated_at=?
    WHERE id=1
  `).run(business_name, email, address || "", city || "", country || "", payout_wallet || "", settle_asset || "USDC", default_terms_days ?? 30, default_tax_rate ?? 0, invoice_prefix || "INV", new Date().toISOString());
  const updated = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  res.json(updated);
});

// ── Clients ──────────────────────────────────────────────

app.get("/api/clients", (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      COALESCE(SUM(i.total), 0) as total_billed,
      COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN i.status = 'sent' THEN i.total ELSE 0 END), 0) as outstanding,
      COUNT(i.id) as invoice_count,
      MAX(i.created_at) as last_invoice_date
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    GROUP BY c.id
    ORDER BY total_billed DESC
  `).all();
  res.json(rows);
});

app.get("/api/clients/:id", (req, res) => {
  const client = db.prepare(`
    SELECT c.*,
      COALESCE(SUM(i.total), 0) as total_billed,
      COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN i.status = 'sent' THEN i.total ELSE 0 END), 0) as outstanding,
      COUNT(i.id) as invoice_count,
      MAX(i.created_at) as last_invoice_date
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.client_id = ?
    ORDER BY i.created_at DESC
  `).all(req.params.id) as Record<string, unknown>[];

  res.json({ ...client, invoices: invoices.map(formatInvoice) });
});

app.post("/api/clients", (req, res) => {
  const { name, contact_name, email, country, city } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const id = nanoid(12);
  db.prepare("INSERT INTO clients (id, name, contact_name, email, country, city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, name, contact_name || "", email || "", country || "", city || "", new Date().toISOString());
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  res.status(201).json(row);
});

// ── Invoices ─────────────────────────────────────────────

app.get("/api/invoices", (req, res) => {
  const { status, client_id, q, sort } = req.query;

  let query = `
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (client_id) {
    query += " AND i.client_id = ?";
    params.push(client_id);
  }

  if (q) {
    query += " AND (i.invoice_number LIKE ? OR c.name LIKE ? OR i.description LIKE ?)";
    const term = `%${q}%`;
    params.push(term, term, term);
  }

  // Status filtering — handle derived statuses
  if (status && status !== "all") {
    if (status === "overdue") {
      query += " AND i.status = 'sent' AND i.due_date < date('now')";
    } else if (status === "viewed") {
      query += " AND i.status = 'sent' AND i.viewed_at IS NOT NULL AND i.due_date >= date('now')";
    } else if (status === "outstanding") {
      query += " AND i.status = 'sent'";
    } else {
      query += " AND i.status = ?";
      params.push(status);
    }
  }

  if (sort === "amount_asc") {
    query += " ORDER BY i.total ASC";
  } else if (sort === "amount_desc") {
    query += " ORDER BY i.total DESC";
  } else if (sort === "due_date") {
    query += " ORDER BY i.due_date ASC";
  } else {
    query += " ORDER BY i.created_at DESC";
  }

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  res.json(rows.map(formatInvoice));
});

app.get("/api/invoices/:id", (req, res) => {
  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: "Invoice not found" });
  res.json(formatInvoice(row));
});

app.post("/api/invoices", (req, res) => {
  const { client_id, description, notes, line_items, tax_rate, terms_days, due_date, currency, status } = req.body;
  if (!client_id || !line_items?.length || !due_date) {
    return res.status(400).json({ error: "client_id, line_items, and due_date are required" });
  }

  const client = db.prepare("SELECT id FROM clients WHERE id = ?").get(client_id);
  if (!client) return res.status(400).json({ error: "Client not found" });

  const id = nanoid(12);
  const invoiceNumber = nextInvoiceNumber();
  const now = new Date().toISOString();
  const subtotal = (line_items as Array<{ quantity: number; rate: number }>).reduce(
    (s: number, li) => s + li.quantity * li.rate, 0
  );
  const effectiveTax = tax_rate ?? 0;
  const taxAmount = subtotal * effectiveTax / 100;
  const total = subtotal + taxAmount;
  const effectiveStatus = status || "draft";
  const sentAt = effectiveStatus === "sent" ? now : null;

  db.prepare(`
    INSERT INTO invoices (id, invoice_number, client_id, description, notes, line_items, subtotal, tax_rate, tax_amount, total, currency, terms_days, issue_date, due_date, status, sent_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, invoiceNumber, client_id, description || "", notes || "", JSON.stringify(line_items), subtotal, effectiveTax, taxAmount, total, currency || "USD", terms_days ?? 30, now.slice(0, 10), due_date, effectiveStatus, sentAt, now, now);

  db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'created', '{}', ?)").run(id, now);

  if (effectiveStatus === "sent") {
    db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'sent', '{}', ?)").run(id, now);
  }

  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(id) as Record<string, unknown>;
  res.status(201).json(formatInvoice(row));
});

app.put("/api/invoices/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!existing) return res.status(404).json({ error: "Invoice not found" });
  if (existing.status !== "draft") return res.status(400).json({ error: "Only draft invoices can be edited" });

  const { description, notes, line_items, tax_rate, terms_days, due_date, client_id } = req.body;
  const now = new Date().toISOString();
  const items = line_items || JSON.parse(existing.line_items as string);
  const subtotal = items.reduce((s: number, li: { quantity: number; rate: number }) => s + li.quantity * li.rate, 0);
  const effectiveTax = tax_rate ?? existing.tax_rate;
  const taxAmount = subtotal * (effectiveTax as number) / 100;
  const total = subtotal + taxAmount;

  db.prepare(`
    UPDATE invoices SET client_id=?, description=?, notes=?, line_items=?, subtotal=?, tax_rate=?, tax_amount=?, total=?, terms_days=?, due_date=?, updated_at=?
    WHERE id=?
  `).run(client_id || existing.client_id, description ?? existing.description, notes ?? existing.notes, JSON.stringify(items), subtotal, effectiveTax, taxAmount, total, terms_days ?? existing.terms_days, due_date || existing.due_date, now, req.params.id);

  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown>;
  res.json(formatInvoice(row));
});

app.post("/api/invoices/:id/send", (req, res) => {
  const inv = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  if (inv.status !== "draft") return res.status(400).json({ error: "Only draft invoices can be sent" });

  const now = new Date().toISOString();
  db.prepare("UPDATE invoices SET status='sent', sent_at=?, updated_at=? WHERE id=?").run(now, now, req.params.id);
  db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'sent', '{}', ?)").run(req.params.id, now);

  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown>;
  const formatted = formatInvoice(row);

  broadcast({
    type: "invoice.sent",
    invoice_id: req.params.id,
    invoice_number: formatted.invoice_number as string,
    client_name: formatted.client_name as string,
    timestamp: now,
  });

  res.json(formatted);
});

app.post("/api/invoices/:id/view", (req, res) => {
  const inv = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!inv) return res.status(404).json({ error: "Invoice not found" });

  const now = new Date().toISOString();
  if (!inv.viewed_at) {
    db.prepare("UPDATE invoices SET viewed_at=?, updated_at=? WHERE id=?").run(now, now, req.params.id);
    db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'viewed', '{}', ?)").run(req.params.id, now);

    const row = db.prepare(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
    `).get(req.params.id) as Record<string, unknown>;

    broadcast({
      type: "invoice.viewed",
      invoice_id: req.params.id,
      invoice_number: (row as any).invoice_number,
      client_name: (row as any).client_name,
      timestamp: now,
    });
  }

  res.json({ success: true });
});

app.post("/api/invoices/:id/remind", (req, res) => {
  const inv = db.prepare("SELECT id FROM invoices WHERE id = ?").get(req.params.id);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  const now = new Date().toISOString();
  db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'reminder_sent', '{}', ?)").run(req.params.id, now);
  res.json({ success: true });
});

app.post("/api/invoices/:id/void", (req, res) => {
  const inv = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  if (inv.status === "paid") return res.status(400).json({ error: "Cannot void a paid invoice" });

  const now = new Date().toISOString();
  db.prepare("UPDATE invoices SET status='void', updated_at=? WHERE id=?").run(now, req.params.id);
  db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'voided', ?, ?)").run(req.params.id, JSON.stringify({ reason: req.body.reason || "" }), now);

  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown>;
  res.json(formatInvoice(row));
});

app.post("/api/invoices/:id/duplicate", (req, res) => {
  const orig = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;
  if (!orig) return res.status(404).json({ error: "Invoice not found" });

  const id = nanoid(12);
  const invoiceNumber = nextInvoiceNumber();
  const now = new Date().toISOString();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (orig.terms_days as number || 30));

  db.prepare(`
    INSERT INTO invoices (id, invoice_number, client_id, description, notes, line_items, subtotal, tax_rate, tax_amount, total, currency, terms_days, issue_date, due_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
  `).run(id, invoiceNumber, orig.client_id, orig.description, orig.notes, orig.line_items, orig.subtotal, orig.tax_rate, orig.tax_amount, orig.total, orig.currency, orig.terms_days, now.slice(0, 10), dueDate.toISOString().slice(0, 10), now, now);

  db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'created', '{}', ?)").run(id, now);

  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(id) as Record<string, unknown>;
  res.status(201).json(formatInvoice(row));
});

app.get("/api/invoices/:id/events", (req, res) => {
  const inv = db.prepare("SELECT id FROM invoices WHERE id = ?").get(req.params.id);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  const events = db.prepare("SELECT * FROM invoice_events WHERE invoice_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json(events);
});

app.delete("/api/invoices/:id", (req, res) => {
  const inv = db.prepare("SELECT id FROM invoices WHERE id = ?").get(req.params.id);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  db.prepare("DELETE FROM invoice_events WHERE invoice_id = ?").run(req.params.id);
  db.prepare("DELETE FROM payments WHERE invoice_id = ?").run(req.params.id);
  db.prepare("DELETE FROM invoices WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ── Payments ─────────────────────────────────────────────

app.get("/api/payments", (_req, res) => {
  const rows = db.prepare(`
    SELECT p.*, i.invoice_number, c.name as client_name
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    JOIN clients c ON c.id = i.client_id
    ORDER BY p.created_at DESC
  `).all();
  res.json(rows);
});

app.get("/api/quote", (req, res) => {
  const { invoice_id, token } = req.query;
  if (!invoice_id || !token) return res.status(400).json({ error: "invoice_id and token required" });

  const inv = db.prepare("SELECT total FROM invoices WHERE id = ?").get(invoice_id as string) as { total: number } | undefined;
  if (!inv) return res.status(404).json({ error: "Invoice not found" });

  const rates: Record<string, { rate: number; chain: string }> = {
    USDC: { rate: 1.0, chain: "NEAR" },
    USDN: { rate: 1.0, chain: "NEAR" },
    NEAR: { rate: 6.42 + Math.random() * 0.3, chain: "NEAR" },
    ETH: { rate: 3480 + Math.random() * 100, chain: "Ethereum" },
    BTC: { rate: 94800 + Math.random() * 1500, chain: "Bitcoin" },
  };

  const tokenData = rates[token as string] || rates.USDC;
  const fee = parseFloat((0.05 + Math.random() * 0.07).toFixed(2));
  const amountIn = tokenData.rate === 1.0 ? inv.total : inv.total / tokenData.rate;
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + 30);

  res.json({
    invoice_id,
    token_in: token,
    amount_usd: inv.total,
    amount_in: parseFloat(amountIn.toFixed(8)),
    rate: parseFloat(tokenData.rate.toFixed(2)),
    fee_usd: fee,
    settle_estimate_seconds: 15 + Math.floor(Math.random() * 20),
    token_out: "USDC",
    amount_out: parseFloat((inv.total - fee).toFixed(2)),
    expires_at: expires.toISOString(),
  });
});

app.post("/api/invoices/:id/pay", (req, res) => {
  const inv = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  if (inv.status === "paid") return res.status(400).json({ error: "Already paid" });

  const { token_in = "USDC", payer_wallet = "anon.near" } = req.body;

  const rates: Record<string, { rate: number; chain: string }> = {
    USDC: { rate: 1.0, chain: "NEAR" },
    USDN: { rate: 1.0, chain: "NEAR" },
    NEAR: { rate: 6.42 + Math.random() * 0.3, chain: "NEAR" },
    ETH: { rate: 3480 + Math.random() * 100, chain: "Ethereum" },
    BTC: { rate: 94800 + Math.random() * 1500, chain: "Bitcoin" },
  };

  const tokenData = rates[token_in] || rates.USDC;
  const total = inv.total as number;
  const fee = parseFloat((0.05 + Math.random() * 0.07).toFixed(2));
  const amountIn = tokenData.rate === 1.0 ? total : total / tokenData.rate;
  const amountOut = parseFloat((total - fee).toFixed(2));
  const settleSeconds = 15 + Math.floor(Math.random() * 20);

  const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let hash = "";
  for (let i = 0; i < 44; i++) hash += BASE58[Math.floor(Math.random() * BASE58.length)];

  const now = new Date().toISOString();
  const paymentId = nanoid(12);

  db.prepare("UPDATE invoices SET status='paid', paid_at=?, updated_at=? WHERE id=?").run(now, now, req.params.id);

  db.prepare(`
    INSERT INTO payments (id, invoice_id, amount_usd, token_in, amount_in, chain_in, token_out, amount_out, fee_usd, rate, payer_wallet, tx_hash, settle_seconds, simulated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'USDC', ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(paymentId, req.params.id, total, token_in, parseFloat(amountIn.toFixed(8)), tokenData.chain, amountOut, fee, tokenData.rate, payer_wallet, hash, settleSeconds, now);

  db.prepare("INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, 'paid', ?, ?)").run(
    req.params.id,
    JSON.stringify({ token: token_in, amount_in: parseFloat(amountIn.toFixed(8)), settle_seconds: settleSeconds }),
    now
  );

  broadcast({
    type: "invoice.paid",
    invoice_id: req.params.id,
    invoice_number: inv.invoice_number as string,
    client_name: inv.client_name as string,
    amount: total,
    token: token_in,
    timestamp: now,
  });

  const payment = db.prepare(`
    SELECT p.*, i.invoice_number, c.name as client_name
    FROM payments p JOIN invoices i ON i.id = p.invoice_id JOIN clients c ON c.id = i.client_id
    WHERE p.id = ?
  `).get(paymentId);

  res.json({ success: true, payment });
});

// ── Stats ────────────────────────────────────────────────

app.get("/api/stats", (_req, res) => {
  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const revenueThisMonth = (db.prepare(
    "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE status='paid' AND paid_at >= ?"
  ).get(thisMonthStart) as { v: number }).v;

  const revenueLastMonth = (db.prepare(
    "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE status='paid' AND paid_at >= ? AND paid_at < ?"
  ).get(lastMonthStart, lastMonthEnd) as { v: number }).v;

  const delta = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

  const outstanding = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as amount, COUNT(*) as count FROM invoices WHERE status='sent' AND due_date >= date('now')"
  ).get() as { amount: number; count: number };

  const overdue = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as amount, COUNT(*) as count FROM invoices WHERE status='sent' AND due_date < date('now')"
  ).get() as { amount: number; count: number };

  const avgSettle = (db.prepare(
    "SELECT COALESCE(AVG(settle_seconds), 0) as v FROM payments"
  ).get() as { v: number }).v;

  const totalRevenue = (db.prepare(
    "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE status='paid'"
  ).get() as { v: number }).v;

  const totalInvoices = (db.prepare("SELECT COUNT(*) as v FROM invoices").get() as { v: number }).v;
  const paidCount = (db.prepare("SELECT COUNT(*) as v FROM invoices WHERE status='paid'").get() as { v: number }).v;

  res.json({
    revenue_this_month: revenueThisMonth,
    revenue_last_month: revenueLastMonth,
    revenue_delta: parseFloat(delta.toFixed(1)),
    outstanding_amount: outstanding.amount,
    outstanding_count: outstanding.count,
    overdue_amount: overdue.amount,
    overdue_count: overdue.count,
    avg_settle_seconds: Math.round(avgSettle),
    total_revenue: totalRevenue,
    total_invoices: totalInvoices,
    paid_count: paidCount,
  });
});

app.get("/api/stats/monthly-revenue", (_req, res) => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
    const rev = (db.prepare(
      "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE status='paid' AND paid_at >= ? AND paid_at < ?"
    ).get(start, end) as { v: number }).v;
    months.push({ month: start.slice(0, 7), revenue: rev });
  }
  res.json(months);
});

app.get("/api/stats/needs-attention", (_req, res) => {
  const rows = db.prepare(`
    SELECT i.id, i.invoice_number, c.name as client_name, i.total, i.due_date, i.viewed_at
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.status = 'sent'
    ORDER BY i.due_date ASC
  `).all() as Record<string, unknown>[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = rows.map((r) => {
    const due = new Date(r.due_date as string);
    const isOverdue = due < today;
    const diffMs = today.getTime() - due.getTime();
    const daysOverdue = isOverdue ? Math.ceil(diffMs / 86400000) : undefined;
    return {
      ...r,
      derived_status: isOverdue ? "overdue" : r.viewed_at ? "viewed" : "sent",
      days_overdue: daysOverdue,
    };
  });

  res.json(result);
});

app.get("/api/stats/activity", (_req, res) => {
  const rows = db.prepare(`
    SELECT e.id, e.invoice_id, i.invoice_number, c.name as client_name, e.type, e.meta, i.total as amount, e.created_at
    FROM invoice_events e
    JOIN invoices i ON i.id = e.invoice_id
    JOIN clients c ON c.id = i.client_id
    ORDER BY e.created_at DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

// ── Reports ──────────────────────────────────────────────

app.get("/api/reports/revenue-by-client", (_req, res) => {
  const rows = db.prepare(`
    SELECT c.id as client_id, c.name as client_name, COALESCE(SUM(i.total), 0) as revenue
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id AND i.status = 'paid'
    GROUP BY c.id
    HAVING revenue > 0
    ORDER BY revenue DESC
  `).all();
  res.json(rows);
});

app.get("/api/reports/revenue-by-token", (_req, res) => {
  const rows = db.prepare(`
    SELECT token_in as token, COUNT(*) as count, COALESCE(SUM(amount_usd), 0) as amount_usd
    FROM payments
    GROUP BY token_in
    ORDER BY amount_usd DESC
  `).all();
  res.json(rows);
});

app.get("/api/reports/aging", (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const all = db.prepare(
    "SELECT total, due_date FROM invoices WHERE status = 'sent'"
  ).all() as { total: number; due_date: string }[];

  const buckets = [
    { label: "Current", count: 0, amount: 0 },
    { label: "1–30 days", count: 0, amount: 0 },
    { label: "31–60 days", count: 0, amount: 0 },
    { label: "60+ days", count: 0, amount: 0 },
  ];

  for (const row of all) {
    const due = new Date(row.due_date);
    const diff = Math.ceil((today.getTime() - due.getTime()) / 86400000);
    if (diff <= 0) {
      buckets[0].count++;
      buckets[0].amount += row.total;
    } else if (diff <= 30) {
      buckets[1].count++;
      buckets[1].amount += row.total;
    } else if (diff <= 60) {
      buckets[2].count++;
      buckets[2].amount += row.total;
    } else {
      buckets[3].count++;
      buckets[3].amount += row.total;
    }
  }

  res.json(buckets);
});

// ── Demo ─────────────────────────────────────────────────

app.post("/api/demo/reset", (_req, res) => {
  resetDemo();
  res.json({ success: true });
});

// ── Start ────────────────────────────────────────────────

seed();

app.listen(PORT, () => {
  console.log(`PayFlow API running on http://localhost:${PORT}`);
});
