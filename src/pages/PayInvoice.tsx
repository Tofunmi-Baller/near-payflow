import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Invoice, PaymentResult } from "../types";
import { fetchInvoice, payInvoice } from "../lib/api";
import { formatCurrency, formatDate, formatDateTime } from "../lib/format";
import { SUPPORTED_TOKENS, formatTokenAmount, NEAR_EXPLORER_BASE, truncateHash } from "../lib/near";

type PaymentStep = "idle" | "initiating" | "routing" | "confirming" | "success";

export default function PayInvoice() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState("USDC");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchInvoice(id)
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const connectWallet = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setWalletAddress(`${rand}.testnet`);
    setWalletConnected(true);
    setConnecting(false);
  };

  const handlePay = async () => {
    if (!id || !invoice || paymentStep !== "idle") return;

    setPaymentStep("initiating");
    await new Promise((r) => setTimeout(r, 1200));

    setPaymentStep("routing");
    await new Promise((r) => setTimeout(r, 1400));

    setPaymentStep("confirming");
    await new Promise((r) => setTimeout(r, 1000));

    try {
      const result = await payInvoice(id, selectedToken, walletAddress);
      setPaymentResult(result);
      setPaymentStep("success");
      setShowConfetti(true);
      setInvoice((prev) => (prev ? { ...prev, status: "paid", payment_tx_hash: result.tx_hash, payment_timestamp: result.timestamp, payment_token: result.token_used } : prev));
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (e: any) {
      setError(e.message);
      setPaymentStep("idle");
    }
  };

  const token = SUPPORTED_TOKENS.find((t) => t.symbol === selectedToken)!;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invoice Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400">This invoice may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {showConfetti && <Confetti />}

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PF</span>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">PayFlow</span>
        </div>

        {/* Invoice card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Invoice from</p>
                <p className="font-semibold text-gray-900 dark:text-white">{invoice.freelancer_name}</p>
                {invoice.freelancer_email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.freelancer_email}</p>
                )}
              </div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Paid
                </span>
              ) : (
                <span className="text-xs text-gray-400">Due {formatDate(invoice.due_date)}</span>
              )}
            </div>

            {invoice.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{invoice.description}</p>
            )}

            {/* Bill to */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Bill to</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.client_name}</p>
            </div>

            {/* Line items */}
            <div className="space-y-2 mb-4">
              {invoice.line_items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.description}
                    {item.quantity > 1 && <span className="text-gray-400"> × {item.quantity}</span>}
                  </span>
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white ml-4">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tax ({invoice.tax_rate}%)</span>
                  <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment section */}
          {isPaid && invoice.payment_tx_hash ? (
            <div className="bg-emerald-50 dark:bg-emerald-950 px-6 py-6 border-t border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">Payment Confirmed</p>
                  {invoice.payment_timestamp && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{formatDateTime(invoice.payment_timestamp)}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300">Transaction</span>
                  <a
                    href={`${NEAR_EXPLORER_BASE}${invoice.payment_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {truncateHash(invoice.payment_tx_hash)}
                  </a>
                </div>
                {invoice.payment_token && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Paid with</span>
                    <span className="text-emerald-800 dark:text-emerald-200">{invoice.payment_token}</span>
                  </div>
                )}
              </div>
            </div>
          ) : paymentStep === "success" && paymentResult ? (
            <div className="bg-emerald-50 dark:bg-emerald-950 px-6 py-6 border-t border-emerald-200 dark:border-emerald-800">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Payment Confirmed!</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(paymentResult.amount_paid)} settled instantly via NEAR
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Transaction</span>
                  <a
                    href={`${NEAR_EXPLORER_BASE}${paymentResult.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {truncateHash(paymentResult.tx_hash)}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Token</span>
                  <span className="text-gray-900 dark:text-white">{paymentResult.token_used}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Block</span>
                  <span className="font-mono text-gray-900 dark:text-white">{paymentResult.block_height.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Time</span>
                  <span className="text-gray-900 dark:text-white">{formatDateTime(paymentResult.timestamp)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-800 space-y-5">
              {/* Token selector */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Pay with</p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_TOKENS.map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => setSelectedToken(t.symbol)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedToken === t.symbol
                          ? "bg-brand-50 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.symbol}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ≈ {formatTokenAmount(invoice.total, selectedToken)} {selectedToken}
                </p>
              </div>

              {/* Wallet connection */}
              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  disabled={connecting}
                  className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                      Connect Wallet
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Connected</span>
                    </div>
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{walletAddress}</span>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={paymentStep !== "idle"}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-lg"
                  >
                    {paymentStep === "idle" && (
                      <>Pay {formatCurrency(invoice.total)} with {selectedToken}</>
                    )}
                    {paymentStep === "initiating" && (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Initiating NEAR Intent...
                      </>
                    )}
                    {paymentStep === "routing" && (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Routing via NEAR Intents...
                      </>
                    )}
                    {paymentStep === "confirming" && (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Confirming on NEAR...
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* NEAR Intents badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>⬡</span>
                <span>Powered by NEAR Intents</span>
              </div>

              {/* How it works */}
              <div>
                <button
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto"
                >
                  <span>How it works</span>
                  <svg className={`w-3 h-3 transition-transform ${showHowItWorks ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {showHowItWorks && (
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Your payment is routed through <strong className="text-gray-700 dark:text-gray-300">NEAR Intents</strong> — any token you hold
                    is automatically swapped to USDC and sent to the freelancer's wallet. Settlement is instant, with full
                    transparency on the NEAR blockchain. No intermediaries, no delays.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          PayFlow — Instant invoicing powered by NEAR
        </p>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6"];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.size > 7 ? "50%" : "1px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
