import db from "./db.ts";
import { nanoid } from "nanoid";

// ── Deterministic pseudo-random (simple mulberry32) ──────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}

// ── Base58 tx hash generator ─────────────────────────────

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function txHash(): string {
  let h = "";
  for (let i = 0; i < 44; i++) h += BASE58[Math.floor(rand() * BASE58.length)];
  return h;
}

// ── Wallet address generator ─────────────────────────────

function walletAddr(): string {
  const names = [
    "sarah", "james", "yuki", "hans", "emma", "lucas", "david", "priya",
    "alex", "chen", "kim", "omar", "sofia", "ryan", "mei", "amir",
  ];
  return `${pick(names)}${randInt(10, 99)}.near`;
}

// ── Date helpers (all relative to now) ───────────────────

function daysAgo(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
}

function daysFromNow(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function hoursAfter(iso: string, hours: number): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

// ── Token data ───────────────────────────────────────────

interface TokenRate {
  symbol: string;
  chain: string;
  rate: number;
}

const TOKENS: TokenRate[] = [
  { symbol: "USDC", chain: "NEAR", rate: 1.0 },
  { symbol: "USDC", chain: "NEAR", rate: 1.0 },
  { symbol: "USDC", chain: "NEAR", rate: 1.0 },
  { symbol: "USDC", chain: "NEAR", rate: 1.0 },
  { symbol: "NEAR", chain: "NEAR", rate: 6.42 + rand() * 0.3 },
  { symbol: "NEAR", chain: "NEAR", rate: 6.45 + rand() * 0.2 },
  { symbol: "NEAR", chain: "NEAR", rate: 6.38 + rand() * 0.4 },
  { symbol: "USDN", chain: "NEAR", rate: 1.0 },
  { symbol: "USDN", chain: "NEAR", rate: 1.0 },
  { symbol: "ETH", chain: "Ethereum", rate: 3480 + rand() * 100 },
  { symbol: "ETH", chain: "Ethereum", rate: 3510 + rand() * 80 },
  { symbol: "BTC", chain: "Bitcoin", rate: 94800 + rand() * 1500 },
];

// ── Line item templates ──────────────────────────────────

const LINE_ITEMS = [
  { desc: "Design system audit", qRange: [8, 24], rRange: [120, 175] },
  { desc: "Frontend development", qRange: [20, 80], rRange: [130, 180] },
  { desc: "API integration", qRange: [10, 40], rRange: [140, 190] },
  { desc: "Monthly retainer", qRange: [1, 1], rRange: [2500, 5000] },
  { desc: "UX research & interviews", qRange: [6, 20], rRange: [110, 160] },
  { desc: "Brand identity design", qRange: [1, 1], rRange: [3000, 6000] },
  { desc: "Mobile app design", qRange: [15, 50], rRange: [125, 170] },
  { desc: "Performance optimization", qRange: [8, 24], rRange: [150, 200] },
  { desc: "Database architecture", qRange: [10, 30], rRange: [145, 195] },
  { desc: "Landing page design", qRange: [1, 1], rRange: [1800, 3500] },
  { desc: "Code review & refactor", qRange: [10, 30], rRange: [120, 165] },
  { desc: "Accessibility audit", qRange: [4, 12], rRange: [130, 175] },
  { desc: "DevOps & CI/CD setup", qRange: [8, 20], rRange: [140, 185] },
  { desc: "Technical documentation", qRange: [6, 16], rRange: [100, 140] },
  { desc: "Prototype & wireframing", qRange: [8, 24], rRange: [110, 155] },
  { desc: "User testing sessions", qRange: [3, 8], rRange: [150, 200] },
  { desc: "Component library build", qRange: [20, 60], rRange: [135, 175] },
  { desc: "Security assessment", qRange: [6, 16], rRange: [160, 200] },
];

function makeLineItems(count: number) {
  const used = new Set<number>();
  const items = [];
  for (let i = 0; i < count; i++) {
    let idx: number;
    do {
      idx = Math.floor(rand() * LINE_ITEMS.length);
    } while (used.has(idx) && used.size < LINE_ITEMS.length);
    used.add(idx);
    const tmpl = LINE_ITEMS[idx];
    const qty = randInt(tmpl.qRange[0], tmpl.qRange[1]);
    const rate = randInt(tmpl.rRange[0], tmpl.rRange[1]);
    items.push({ description: tmpl.desc, quantity: qty, rate, amount: qty * rate });
  }
  return items;
}

// ── Seed function ────────────────────────────────────────

export function resetDemo() {
  db.exec("DELETE FROM invoice_events");
  db.exec("DELETE FROM payments");
  db.exec("DELETE FROM invoices");
  db.exec("DELETE FROM clients");
  db.exec("DELETE FROM profile");
  seedAll();
}

function seedAll() {
  const now = new Date().toISOString();

  // Profile
  db.prepare(`
    INSERT OR REPLACE INTO profile (id, business_name, email, address, city, country, payout_wallet, settle_asset, default_terms_days, default_tax_rate, invoice_prefix, created_at, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, 'USDC', 30, 0, 'INV', ?, ?)
  `).run("Maya Chen Studio", "maya@mayachen.studio", "Rua Augusta 42, 3rd Floor", "Lisbon", "Portugal", "mayachen.near", daysAgo(365), now);

  // Clients
  const clients = [
    { name: "Northwind Labs", contact: "Sarah Mitchell", email: "sarah@northwindlabs.io", country: "US", city: "San Francisco" },
    { name: "Lumen Health", contact: "James Crawford", email: "james@lumenhealth.co.uk", country: "UK", city: "London" },
    { name: "Kobo Studio", contact: "Yuki Tanaka", email: "yuki@kobostudio.jp", country: "Japan", city: "Tokyo" },
    { name: "Atlas Freight", contact: "Hans Mueller", email: "hans@atlasfreight.de", country: "Germany", city: "Berlin" },
    { name: "Brightside Coffee", contact: "Emma Wilson", email: "emma@brightsidecoffee.com.au", country: "Australia", city: "Melbourne" },
    { name: "Verde Energia", contact: "Lucas Silva", email: "lucas@verdeenergia.com.br", country: "Brazil", city: "São Paulo" },
    { name: "Halcyon Games", contact: "David Park", email: "david@halcyongames.ca", country: "Canada", city: "Vancouver" },
    { name: "Orbit Analytics", contact: "Priya Sharma", email: "priya@orbitanalytics.sg", country: "Singapore", city: "Singapore" },
  ];

  const clientIds: string[] = [];
  const insertClient = db.prepare(
    "INSERT INTO clients (id, name, contact_name, email, country, city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  for (const c of clients) {
    const id = nanoid(12);
    clientIds.push(id);
    insertClient.run(id, c.name, c.contact, c.email, c.country, c.city, daysAgo(randInt(300, 365)));
  }

  // Invoice definitions — ordered chronologically
  // Each: { clientIdx, daysAgoCreated, status, lineItemCount, viewed?, paidDaysAfterSent? }
  const invoiceDefs = [
    // Month 1-2 (11-12 months ago) — early, lower revenue
    { ci: 0, ago: 340, st: "paid", lic: 2, paidAfter: 5 },
    { ci: 1, ago: 330, st: "paid", lic: 1, paidAfter: 3 },
    { ci: 2, ago: 320, st: "paid", lic: 2, paidAfter: 8 },
    // Month 3 (10 months ago)
    { ci: 3, ago: 300, st: "paid", lic: 2, paidAfter: 12 },
    { ci: 0, ago: 290, st: "paid", lic: 3, paidAfter: 4 },
    // Month 4 (9 months ago)
    { ci: 4, ago: 270, st: "paid", lic: 2, paidAfter: 6 },
    { ci: 5, ago: 265, st: "paid", lic: 1, paidAfter: 2 },
    // Month 5 (8 months ago) — dip
    { ci: 1, ago: 245, st: "paid", lic: 1, paidAfter: 15 },
    { ci: 6, ago: 240, st: "void", lic: 2 },
    // Month 6 (7 months ago)
    { ci: 7, ago: 215, st: "paid", lic: 2, paidAfter: 7 },
    { ci: 0, ago: 210, st: "paid", lic: 3, paidAfter: 3 },
    { ci: 2, ago: 205, st: "paid", lic: 2, paidAfter: 9 },
    // Month 7 (6 months ago)
    { ci: 3, ago: 185, st: "paid", lic: 2, paidAfter: 5 },
    { ci: 4, ago: 180, st: "paid", lic: 3, paidAfter: 6 },
    // Month 8 (5 months ago)
    { ci: 1, ago: 155, st: "paid", lic: 2, paidAfter: 4 },
    { ci: 5, ago: 150, st: "paid", lic: 3, paidAfter: 8 },
    { ci: 6, ago: 145, st: "paid", lic: 2, paidAfter: 10 },
    // Month 9 (4 months ago)
    { ci: 7, ago: 125, st: "paid", lic: 3, paidAfter: 3 },
    { ci: 0, ago: 120, st: "paid", lic: 2, paidAfter: 5 },
    { ci: 2, ago: 115, st: "paid", lic: 3, paidAfter: 7 },
    // Month 10 (3 months ago)
    { ci: 3, ago: 95, st: "paid", lic: 3, paidAfter: 4 },
    { ci: 1, ago: 90, st: "paid", lic: 2, paidAfter: 6 },
    { ci: 4, ago: 85, st: "paid", lic: 3, paidAfter: 9 },
    // Month 11 (2 months ago)
    { ci: 5, ago: 65, st: "paid", lic: 2, paidAfter: 5 },
    { ci: 7, ago: 60, st: "paid", lic: 3, paidAfter: 3 },
    { ci: 6, ago: 55, st: "paid", lic: 2, paidAfter: 4 },
    { ci: 0, ago: 50, st: "paid", lic: 3, paidAfter: 7 },
    // Month 12 (recent — last 30 days and current)
    { ci: 2, ago: 35, st: "paid", lic: 3, paidAfter: 6 },
    { ci: 1, ago: 28, st: "paid", lic: 2, paidAfter: 4 },
    // Overdue invoices
    { ci: 3, ago: 40, st: "sent", lic: 2, overdueDays: 35 },  // 35 days overdue
    { ci: 4, ago: 25, st: "sent", lic: 2, overdueDays: 12 },  // 12 days overdue
    { ci: 5, ago: 18, st: "sent", lic: 1, overdueDays: 4 },   // 4 days overdue
    // Outstanding (sent, not overdue)
    { ci: 7, ago: 12, st: "sent", lic: 2, viewed: true },
    { ci: 6, ago: 10, st: "sent", lic: 3 },
    { ci: 2, ago: 8, st: "sent", lic: 2, viewed: true },
    { ci: 1, ago: 5, st: "sent", lic: 2 },
    // Drafts
    { ci: 4, ago: 3, st: "draft", lic: 2 },
    // *** Hero invoice: INV-0038, Northwind Labs, $4,800, sent, due in 5 days ***
    { ci: 0, ago: 2, st: "sent", lic: 0, hero: true },
    // More drafts
    { ci: 3, ago: 1, st: "draft", lic: 1 },
    { ci: 7, ago: 0, st: "draft", lic: 2 },
  ] as Array<{
    ci: number;
    ago: number;
    st: string;
    lic: number;
    paidAfter?: number;
    overdueDays?: number;
    viewed?: boolean;
    hero?: boolean;
  }>;

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, invoice_number, client_id, description, notes, line_items, subtotal, tax_rate, tax_amount, total, currency, terms_days, issue_date, due_date, status, sent_at, viewed_at, paid_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, invoice_id, amount_usd, token_in, amount_in, chain_in, token_out, amount_out, fee_usd, rate, payer_wallet, tx_hash, settle_seconds, simulated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'USDC', ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const insertEvent = db.prepare(
    "INSERT INTO invoice_events (invoice_id, type, meta, created_at) VALUES (?, ?, ?, ?)"
  );

  const descriptions = [
    "Website redesign & development",
    "Mobile app UI/UX design",
    "Backend API development",
    "Brand identity project",
    "Product design sprint",
    "Technical consulting",
    "Full-stack development",
    "Design system build",
    "Platform migration",
    "UX audit & optimization",
  ];

  for (let i = 0; i < invoiceDefs.length; i++) {
    const def = invoiceDefs[i];
    const invId = def.hero ? "hero_invoice_1" : nanoid(12);
    const invNum = `INV-${String(i + 1).padStart(4, "0")}`;
    const clientId = clientIds[def.ci];
    const createdAt = daysAgo(def.ago);
    const issueDate = dateOnly(createdAt);

    let lineItems;
    let subtotal: number;
    let total: number;

    if (def.hero) {
      // Hero invoice: exact $4,800
      lineItems = [
        { description: "Product design sprint — Phase 2", quantity: 24, rate: 150, amount: 3600 },
        { description: "Interactive prototype", quantity: 8, rate: 150, amount: 1200 },
      ];
      subtotal = 4800;
      total = 4800;
    } else if (def.lic === 0) {
      lineItems = makeLineItems(2);
      subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
      total = subtotal;
    } else {
      lineItems = makeLineItems(def.lic);
      subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
      total = subtotal;
    }

    let dueDateStr: string;
    if (def.overdueDays) {
      dueDateStr = dateOnly(daysAgo(def.overdueDays));
    } else if (def.hero) {
      dueDateStr = dateOnly(daysFromNow(5));
    } else if (def.st === "draft") {
      dueDateStr = dateOnly(daysFromNow(randInt(14, 30)));
    } else {
      dueDateStr = dateOnly(daysAgo(Math.max(0, def.ago - 30)));
    }

    const sentAt = def.st !== "draft" ? hoursAfter(createdAt, randInt(0, 4)) : null;
    let viewedAt: string | null = null;
    let paidAt: string | null = null;

    if (def.st === "paid" && def.paidAfter) {
      viewedAt = hoursAfter(sentAt!, randInt(1, 24));
      paidAt = hoursAfter(sentAt!, def.paidAfter * 24 + randInt(0, 12));
    } else if (def.viewed) {
      viewedAt = hoursAfter(sentAt!, randInt(2, 48));
    } else if (def.st === "paid") {
      viewedAt = hoursAfter(sentAt!, randInt(1, 12));
      paidAt = hoursAfter(sentAt!, randInt(24, 72));
    }

    const desc = pick(descriptions);
    const notes = rand() > 0.6 ? "Payment terms: Net 30. Thank you for your business!" : "";

    insertInvoice.run(
      invId, invNum, clientId, desc, notes,
      JSON.stringify(lineItems), subtotal, 0, 0, total,
      30, issueDate, dueDateStr,
      def.st === "void" ? "void" : def.st === "paid" ? "paid" : def.st === "draft" ? "draft" : "sent",
      sentAt, viewedAt, paidAt,
      createdAt, paidAt || sentAt || createdAt
    );

    // Events
    insertEvent.run(invId, "created", "{}", createdAt);

    if (sentAt) {
      insertEvent.run(invId, "sent", "{}", sentAt);
    }

    if (viewedAt) {
      insertEvent.run(invId, "viewed", "{}", viewedAt);
    }

    if (def.st === "paid" && paidAt) {
      // Create payment
      const tok = pick(TOKENS);
      const fee = randFloat(0.05, 0.15);
      const amountOut = total - fee;
      const amountIn = tok.rate === 1.0 ? total : total / tok.rate;
      const settleSeconds = randInt(11, 48);

      insertPayment.run(
        nanoid(12), invId, total,
        tok.symbol, parseFloat(amountIn.toFixed(8)),
        tok.chain, parseFloat(amountOut.toFixed(2)),
        fee, tok.rate, walletAddr(), txHash(),
        settleSeconds, paidAt
      );

      insertEvent.run(invId, "paid", JSON.stringify({
        token: tok.symbol,
        amount_in: parseFloat(amountIn.toFixed(8)),
        settle_seconds: settleSeconds,
      }), paidAt);
    }

    if (def.st === "void") {
      const voidedAt = hoursAfter(createdAt, randInt(24, 72));
      insertEvent.run(invId, "voided", JSON.stringify({ reason: "Client requested cancellation" }), voidedAt);
    }
  }
}

export function seed() {
  const count = (db.prepare("SELECT COUNT(*) as c FROM invoices").get() as { c: number }).c;
  if (count === 0) {
    seedAll();
    console.log("Demo data seeded: 8 clients, ~40 invoices, payments, and events");
  }
}
