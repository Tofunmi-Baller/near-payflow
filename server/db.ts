import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "payflow.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    freelancer_name TEXT NOT NULL,
    freelancer_email TEXT NOT NULL,
    freelancer_wallet TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    description TEXT NOT NULL,
    line_items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax_rate REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    payment_tx_hash TEXT,
    payment_timestamp TEXT,
    payment_token TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

export default db;
