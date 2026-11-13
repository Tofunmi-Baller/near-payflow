import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import type { Invoice } from "../types";
import { fetchInvoice, deleteInvoice } from "../lib/api";
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusLabel } from "../lib/format";
import { NEAR_EXPLORER_BASE, truncateHash } from "../lib/near";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchInvoice(id)
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const paymentLink = `${window.location.origin}/pay/${id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteInvoice(id);
      navigate("/");
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error || "Invoice not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoice #{invoice.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Created {formatDate(invoice.created_at)}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
          {getStatusLabel(invoice.status)}
        </span>
      </div>

      {/* Invoice card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PF</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">PayFlow</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Invoice</p>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-300">{invoice.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">From</p>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.freelancer_name}</p>
            {invoice.freelancer_email && <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.freelancer_email}</p>}
            {invoice.freelancer_wallet && (
              <p className="text-xs font-mono text-gray-400 mt-1">{invoice.freelancer_wallet}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">To</p>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.client_email}</p>}
          </div>
        </div>

        {invoice.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-6">{invoice.description}</p>
        )}

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Rate</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(item.rate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
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
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-6">Due: {formatDate(invoice.due_date)}</p>
      </div>

      {/* Payment confirmation */}
      {invoice.status === "paid" && invoice.payment_tx_hash && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">Payment Confirmed</h3>
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
            {invoice.payment_timestamp && (
              <div className="flex justify-between">
                <span className="text-emerald-700 dark:text-emerald-300">Timestamp</span>
                <span className="text-emerald-800 dark:text-emerald-200">{formatDateTime(invoice.payment_timestamp)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share / Payment link */}
      {invoice.status !== "paid" && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {invoice.status === "sent" ? "Awaiting Payment" : "Payment Link"}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">Share this link with your client to receive payment:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
              {paymentLink}
            </code>
            <button
              onClick={copyLink}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {invoice.status !== "paid" && (
          <Link
            to={`/pay/${invoice.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Open Payment Page
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors border border-red-200 dark:border-red-800"
        >
          {deleting ? "Deleting..." : "Delete Invoice"}
        </button>
      </div>
    </div>
  );
}
