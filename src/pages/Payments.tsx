import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { Payment } from "../types";
import { fetchPayments } from "../lib/api";
import {
  formatCurrency,
  formatDateTime,
  formatSettleTime,
  getInitials,
  getAvatarColor,
} from "../lib/format";
import { truncateHash } from "../lib/near";

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const totalReceived = payments.reduce((s, p) => s + p.amount_out, 0);
  const avgSettle =
    payments.length > 0
      ? payments.reduce((s, p) => s + p.settle_seconds, 0) / payments.length
      : 0;
  const totalFees = payments.reduce((s, p) => s + p.fee_usd, 0);
  const cardFeeEquiv = totalReceived * 0.029;
  const feesSaved = cardFeeEquiv - totalFees;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payments
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          All incoming payments via NEAR Intents
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Total Received
          </div>
          <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalReceived)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            in USDC · {payments.length} payments
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="w-3.5 h-3.5" />
            Avg Settlement
          </div>
          <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">
            {formatSettleTime(Math.round(avgSettle))}
          </p>
          <p className="text-xs text-gray-400 mt-1">via NEAR Intents</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Fees Saved vs Cards
          </div>
          <p className="text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
            {formatCurrency(feesSaved)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            vs 2.9% card processing
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No payments yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Payments will appear here when clients pay your invoices
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Paid In
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider text-right">
                    Received
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider text-right">
                    Fee
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider text-right">
                    Settlement
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Tx
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Link
                        to={`/app/invoices/${p.invoice_id}`}
                        className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {p.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white ${getAvatarColor(p.client_name)}`}
                        >
                          {getInitials(p.client_name)}
                        </div>
                        <span className="text-gray-900 dark:text-white">
                          {p.client_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-900 dark:text-white font-medium tabular-nums">
                          {p.amount_in < 1
                            ? p.amount_in.toFixed(6)
                            : p.amount_in.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {p.token_in}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                          {formatCurrency(p.amount_out)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          USDC
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount_out)}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-gray-500 dark:text-gray-400">
                      ${p.fee_usd.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {formatSettleTime(p.settle_seconds)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                        {truncateHash(p.tx_hash)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {payments.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${getAvatarColor(p.client_name)}`}
                    >
                      {getInitials(p.client_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {p.client_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.invoice_number}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(p.amount_out)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {p.amount_in < 1
                      ? p.amount_in.toFixed(4)
                      : p.amount_in.toFixed(2)}{" "}
                    {p.token_in} → USDC
                  </span>
                  <span>·</span>
                  <span className="text-violet-600 dark:text-violet-400">
                    {formatSettleTime(p.settle_seconds)}
                  </span>
                  <span>·</span>
                  <span>${p.fee_usd.toFixed(2)} fee</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
