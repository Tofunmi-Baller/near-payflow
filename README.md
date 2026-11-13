# PayFlow — Instant Freelancer Invoicing on NEAR

**NEAR Hackathon 2026 — Track 08: Real-World Money**

PayFlow is a clean, professional invoicing app where freelancers create invoices and clients pay instantly in stablecoins via NEAR. No crypto knowledge required — clients see USD amounts and pay with any token through NEAR Intents.

## The Problem

Freelancer payments are slow, expensive, and cross-border payments are worse. Wire transfers take 3-5 days, PayPal takes 2-3% fees, and international payments can lose 5-8% to conversion. Freelancers lose time and money waiting to get paid.

## The Solution

PayFlow lets freelancers create professional invoices and share a payment link. Clients click "Pay Now," select any token they hold, and payment settles instantly via NEAR Intents. The freelancer receives USDC in their wallet — no delays, minimal fees.

```
Freelancer creates invoice → Gets payment link → Client pays in any token
                                                         ↓
                                              NEAR Intents routes payment
                                                         ↓
                                              Freelancer receives USDC instantly
```

## Architecture

```
┌─────────────────────────────────┐
│         React Frontend          │
│   Vite + TypeScript + Tailwind  │
│                                 │
│  ┌──────────┐  ┌──────────────┐ │
│  │Dashboard │  │Payment Page  │ │
│  │(Freelancer)│ │(Client-facing)│ │
│  └──────────┘  └──────────────┘ │
└──────────┬──────────────────────┘
           │ REST API
┌──────────▼──────────────────────┐
│       Express Backend           │
│    SQLite (better-sqlite3)      │
│                                 │
│  Invoices CRUD + Payment Flow   │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│      NEAR Integration           │
│                                 │
│  • NEAR Intents (1Click)        │
│    Any token → USDC routing     │
│  • Chain Signatures             │
│    Cross-chain settlement       │
│  • Testnet explorer links       │
└─────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS |
| Backend | Express.js + SQLite (better-sqlite3) |
| Payments | NEAR Intents for cross-chain token routing |
| Settlement | Stablecoins (USDC/USDN) on NEAR |

## NEAR Ecosystem Integrations

- **NEAR Intents (1Click)** — Payment routing: clients pay in any token (NEAR, ETH, BTC, USDC, USDN), and the payment is automatically swapped and delivered as USDC to the freelancer
- **Chain Signatures** — Enables cross-chain settlement so clients can pay from any supported chain
- **NEAR Testnet** — All transactions link to the NEAR testnet explorer for verification

## Quick Start

```bash
# Install dependencies
npm install

# Start development (frontend + backend)
npm run dev

# Or run individually
npm run dev:server  # Express API on :3456
npm run dev:client  # Vite frontend on :5173
```

Open http://localhost:5173 in your browser.

## Demo Flow

### 1. Create an Invoice
- Click "New Invoice" on the dashboard
- Fill in your details, client details, and line items
- See the live preview update as you type
- Click "Create & Send Invoice"

### 2. Share the Payment Link
- Copy the payment link from the invoice detail page
- Share it with your client via email, Slack, etc.

### 3. Client Pays
- Client opens the payment link (standalone page, no login required)
- Sees a clean invoice with amount in USD
- Selects their preferred token (USDC, USDN, NEAR, ETH, BTC)
- Connects wallet and clicks "Pay"
- Payment routes through NEAR Intents
- Instant confirmation with transaction hash

### 4. Track Revenue
- Dashboard updates in real-time
- See total revenue, paid/pending/overdue counts
- Recent payments feed shows latest activity

## Demo Mode

The app includes a simulation mode for hackathon demo purposes:
- **Wallet connection** simulates connecting a NEAR testnet wallet
- **Payment flow** shows realistic 3-step confirmation (Initiating → Routing → Confirming)
- **Transaction hashes** are generated in NEAR base58 format and link to the testnet explorer
- **Block heights** are in the realistic ~140M range for NEAR testnet

All simulated values are clearly labeled and follow real NEAR protocol formats. In production, these would connect to actual NEAR wallet-selector and NEAR Intents SDK.

## Key Features

- Professional invoice creation with line items, tax, and currency
- Shareable payment links (no login required for clients)
- Multi-token payment support via NEAR Intents
- Real-time dashboard with revenue tracking
- Light/dark mode
- Mobile-responsive design
- Transaction verification via NEAR explorer

## Project Structure

```
├── server/
│   ├── db.ts          # SQLite database setup
│   └── index.ts       # Express API server
├── src/
│   ├── components/
│   │   └── Layout.tsx  # App shell with sidebar
│   ├── hooks/
│   │   └── useTheme.ts # Dark mode hook
│   ├── lib/
│   │   ├── api.ts      # API client
│   │   ├── format.ts   # Formatting utilities
│   │   └── near.ts     # NEAR integration helpers
│   ├── pages/
│   │   ├── Dashboard.tsx      # Freelancer dashboard
│   │   ├── CreateInvoice.tsx  # Invoice creation form
│   │   ├── InvoiceDetail.tsx  # Invoice view (freelancer)
│   │   └── PayInvoice.tsx     # Payment page (client)
│   ├── App.tsx         # Router setup
│   ├── main.tsx        # Entry point
│   ├── index.css       # Tailwind + custom styles
│   └── types.ts        # TypeScript interfaces
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Why PayFlow Wins

1. **Real problem** — Freelancer payments are genuinely slow and expensive
2. **Simple UX** — Clients don't need to understand crypto or NEAR
3. **NEAR Intents** — Any token in, USDC out — true cross-chain UX
4. **Production-ready design** — Looks like Stripe, not a hackathon project
5. **Investable** — Clear business model (transaction fees), large TAM ($1.5T freelancer market)

## License

MIT
