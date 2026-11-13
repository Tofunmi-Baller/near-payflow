import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Wallet,
  CheckCircle2,
  ArrowDownToLine,
  RefreshCw,
  Zap,
  ChevronDown,
  Shield,
} from "lucide-react";
import type { Invoice, PaymentResult, PaymentQuote } from "../types";
import { fetchInvoice, fetchQuote, payInvoice, viewInvoice } from "../lib/api";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatSettleTime,
} from "../lib/format";
import { SUPPORTED_TOKENS } from "../lib/near";

type PayStep = "idle" | "quote" | "deposit" | "swapping" | "delivered" | "done";

const STEPS: { key: PayStep; label: string }[] = [
  { key: "quote", label: "Quote locked" },
  { key: "deposit", label: "Deposit received" },
  { key: "swapping", label: "Swapping via NEAR Intents" },
  { key: "delivered", label: "USDC delivered" },
];

export default function PayInvoice() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState("USDC");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [payStep, setPayStep] = useState<PayStep>("idle");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null,
  );
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const viewedRef = useRef(false);

  // Apply dark mode
  useEffect(() => {
    const stored = localStorage.getItem("payflow-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        if (!viewedRef.current && inv.status !== "paid") {
          viewedRef.current = true;
          viewInvoice(id).catch(() => {});
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !invoice || invoice.status === "paid") return;
    setQuoteLoading(true);
    fetchQuote(id, selectedToken)
      .then(setQuote)
      .catch(() => setQuote(null))
      .finally(() => setQuoteLoading(false));
  }, [id, selectedToken, invoice?.status]);

  const connectWallet = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const rand = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    setWalletAddress(`${rand}.testnet`);
    setWalletConnected(true);
    setConnecting(false);
  };

  const handlePay = async () => {
    if (!id || !invoice || payStep !== "idle") return;

    setPayStep("quote");
    await new Promise((r) => setTimeout(r, 1000));

    setPayStep("deposit");
    await new Promise((r) => setTimeout(r, 1200));

    setPayStep("swapping");
    await new Promise((r) => setTimeout(r, 1500));

    setPayStep("delivered");
    await new Promise((r) => setTimeout(r, 800));

    try {
      const result = await payInvoice(id, selectedToken, walletAddress);
      setPaymentResult(result);
      setPayStep("done");
      setShowConfetti(true);
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: "paid",
              derived_status: "paid",
              paid_at: result.payment.created_at,
            }
          : prev,
      );
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (e: any) {
      setError(e.message);
      setPayStep("idle");
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === payStep);
  const token = SUPPORTED_TOKENS.find((t) => t.symbol === selectedToken);

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
          <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Invoice Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            This invoice may have been deleted or the link is invalid.
          </p>
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
          <span className="font-bold text-xl text-gray-900 dark:text-white">
            PayFlow
          </span>
        </div>

        {/* Invoice card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Invoice from
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {/* Profile name is in the invoice context from backend */}
                  Invoice {invoice.invoice_number}
                </p>
              </div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Paid
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  Due {formatDate(invoice.due_date)}
                </span>
              )}
            </div>

            {invoice.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {invoice.description}
              </p>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Bill to</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {invoice.client_name}
              </p>
            </div>

            {/* Line items */}
            <div className="space-y-2 mb-4">
              {invoice.line_items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.description}
                    {item.quantity > 1 && (
                      <span className="text-gray-400"> × {item.quantity}</span>
                    )}
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
                <span className="text-gray-500 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Tax ({invoice.tax_rate}%)
                  </span>
                  <span className="tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(invoice.tax_amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment section */}
          {isPaid || payStep === "done" ? (
            <div className="bg-emerald-50 dark:bg-emerald-950 px-6 py-6 border-t border-emerald-200 dark:border-emerald-800">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                  Payment Confirmed!
                </h3>
                {paymentResult && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(paymentResult.payment.amount_usd)} settled
                    in {formatSettleTime(paymentResult.payment.settle_seconds)}{" "}
                    via NEAR
                  </p>
                )}
              </div>
              {paymentResult && (
                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Token
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {paymentResult.payment.amount_in < 1
                        ? paymentResult.payment.amount_in.toFixed(6)
                        : paymentResult.payment.amount_in.toFixed(2)}{" "}
                      {paymentResult.payment.token_in}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Received
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(paymentResult.payment.amount_out)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Fee
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      ${paymentResult.payment.fee_usd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Settlement
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-medium">
                      {formatSettleTime(paymentResult.payment.settle_seconds)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Time
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDateTime(paymentResult.payment.created_at)}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-center text-emerald-500/60 uppercase font-semibold tracking-wider mt-3">
                Testnet simulation
              </p>
            </div>
          ) : (
            <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-800 space-y-5">
              {/* Token selector */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  Pay with
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_TOKENS.map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => setSelectedToken(t.symbol)}
                      disabled={payStep !== "idle"}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedToken === t.symbol
                          ? "bg-brand-50 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.symbol}
                    </button>
                  ))}
                </div>

                {/* Quote line */}
                {quote && !quoteLoading && (
                  <div className="mt-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                    You pay{" "}
                    <span className="font-semibold">
                      {quote.amount_in < 1
                        ? quote.amount_in.toFixed(6)
                        : quote.amount_in.toFixed(4)}{" "}
                      {quote.token_in}
                    </span>{" "}
                    · Freelancer receives{" "}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(quote.amount_out)} USDC
                    </span>{" "}
                    · Fee ${quote.fee_usd.toFixed(2)} ·{" "}
                    ~{formatSettleTime(quote.settle_estimate_seconds)}
                  </div>
                )}
                {quoteLoading && (
                  <div className="mt-2 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                )}
              </div>

              {/* Payment progress stepper (when paying) */}
              {payStep !== "idle" && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="space-y-3">
                    {STEPS.map((step, i) => {
                      const isComplete = currentStepIndex > i;
                      const isCurrent = currentStepIndex === i;
                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isComplete
                                ? "bg-emerald-500"
                                : isCurrent
                                  ? "bg-brand-600 animate-pulse"
                                  : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ) : isCurrent ? (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            ) : (
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isComplete
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : isCurrent
                                  ? "text-gray-900 dark:text-white font-semibold"
                                  : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wallet connection / Pay button */}
              {payStep === "idle" && (
                <>
                  {!walletConnected ? (
                    <button
                      onClick={connectWallet}
                      disabled={connecting}
                      className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5" />
                          Connect Wallet
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Connected
                          </span>
                        </div>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {walletAddress}
                        </span>
                      </div>

                      <button
                        onClick={handlePay}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-lg"
                      >
                        Pay {formatCurrency(invoice.total)} with{" "}
                        {selectedToken}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* NEAR badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Zap className="w-3 h-3" />
                <span>Powered by NEAR Intents</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">
                  Testnet
                </span>
              </div>

              {/* How it works */}
              <div>
                <button
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto"
                >
                  <span>How it works</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showHowItWorks ? "rotate-180" : ""}`}
                  />
                </button>
                {showHowItWorks && (
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Your payment is routed through{" "}
                    <strong className="text-gray-700 dark:text-gray-300">
                      NEAR Intents
                    </strong>{" "}
                    — any token you hold is automatically swapped to USDC and
                    sent to the freelancer's wallet. Settlement is instant, with
                    full transparency on the NEAR blockchain. No intermediaries,
                    no delays.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          PayFlow — Instant invoicing powered by NEAR
        </p>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#3b82f6",
    "#8b5cf6",
  ];
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
          className="absolute"
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
