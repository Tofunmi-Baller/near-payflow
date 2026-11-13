import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Copy,
  Send,
  ExternalLink,
  FileText,
  Trash2,
  Bell,
  CheckCircle2,
  Eye,
  CreditCard,
  XCircle,
  Clock,
  ArrowRight,
  Ban,
} from "lucide-react";
import type { Invoice, InvoiceEvent, Profile, SSEEvent } from "../types";
import {
  fetchInvoice,
  fetchInvoiceEvents,
  fetchProfile,
  sendInvoice,
  remindInvoice,
  voidInvoice,
  duplicateInvoice,
  deleteInvoice,
} from "../lib/api";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  getStatusColor,
  getStatusLabel,
  formatSettleTime,
  getInitials,
  getAvatarColor,
} from "../lib/format";
import { truncateHash } from "../lib/near";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    Promise.all([fetchInvoice(id), fetchInvoiceEvents(id), fetchProfile()])
      .then(([inv, evts, prof]) => {
        setInvoice(inv);
        setEvents(evts);
        setProfile(prof);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (!id) return;
    const evtSource = new EventSource("/api/events");
    evtSource.onmessage = (e) => {
      try {
        const evt: SSEEvent = JSON.parse(e.data);
        if (evt.invoice_id === id) load();
      } catch {}
    };
    return () => evtSource.close();
  }, [id]);

  const paymentLink = `${window.location.origin}/pay/${id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (
    action: "send" | "remind" | "void" | "duplicate" | "delete",
  ) => {
    if (!id) return;
    setActionLoading(action);
    try {
      switch (action) {
        case "send": {
          const updated = await sendInvoice(id);
          setInvoice(updated);
          fetchInvoiceEvents(id).then(setEvents);
          break;
        }
        case "remind":
          await remindInvoice(id);
          fetchInvoiceEvents(id).then(setEvents);
          break;
        case "void":
          if (!confirm("Void this invoice? This cannot be undone.")) break;
          await voidInvoice(id);
          load();
          break;
        case "duplicate": {
          const dup = await duplicateInvoice(id);
          navigate(`/app/invoices/${dup.id}`);
          break;
        }
        case "delete":
          if (!confirm("Delete this invoice? This cannot be undone.")) break;
          await deleteInvoice(id);
          navigate("/app/invoices");
          break;
      }
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Invoices
        </Link>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            {error || "Invoice not found"}
          </p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.derived_status === "paid";
  const isVoid = invoice.derived_status === "void";
  const isDraft = invoice.derived_status === "draft";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/app/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Invoices
        </Link>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.derived_status)}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPaid
                ? "bg-emerald-500"
                : invoice.derived_status === "overdue"
                  ? "bg-red-500"
                  : invoice.derived_status === "sent"
                    ? "bg-blue-500"
                    : invoice.derived_status === "viewed"
                      ? "bg-amber-500"
                      : "bg-gray-400"
            }`}
          />
          {getStatusLabel(invoice.derived_status)}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Invoice document */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PF</span>
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  PayFlow
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Invoice
                </p>
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {invoice.invoice_number}
                </p>
              </div>
            </div>

            <div className="p-8">
              {/* Dates */}
              <div className="flex gap-6 mb-6 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Issued</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(invoice.issue_date)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Due</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(invoice.due_date)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Terms</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Net {invoice.terms_days}
                  </p>
                </div>
              </div>

              {/* From / To */}
              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                    From
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profile?.business_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {profile?.email}
                  </p>
                  {profile?.payout_wallet && (
                    <p className="text-xs font-mono text-gray-400 mt-1">
                      {profile.payout_wallet}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                    To
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAvatarColor(invoice.client_name)}`}
                    >
                      {getInitials(invoice.client_name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {invoice.client_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.client_email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  {invoice.description}
                </p>
              )}

              {/* Line items table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Rate</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
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
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total)}
                    </span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Primary action */}
          {isDraft && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                This invoice is still a draft.
              </p>
              <button
                onClick={() => handleAction("send")}
                disabled={actionLoading === "send"}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                {actionLoading === "send" ? "Sending..." : "Send Invoice"}
              </button>
            </div>
          )}

          {/* Payment confirmation */}
          {isPaid && invoice.paid_at && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
                  Payment Confirmed
                </h3>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                Paid {formatDateTime(invoice.paid_at)}
              </p>
              <p className="text-[10px] text-emerald-500/70 uppercase font-semibold tracking-wider mt-2">
                Testnet simulation
              </p>
            </div>
          )}

          {/* Share card */}
          {!isPaid && !isVoid && !isDraft && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                Payment Link
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300 font-mono truncate">
                  {paymentLink}
                </code>
                <button
                  onClick={copyLink}
                  className="shrink-0 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                  Copied!
                </p>
              )}
              <div className="flex justify-center my-3">
                <QRCodeSVG value={paymentLink} size={120} />
              </div>
              <a
                href={`/pay/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Open as Client
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {(invoice.derived_status === "sent" ||
                invoice.derived_status === "overdue" ||
                invoice.derived_status === "viewed") && (
                <button
                  onClick={() => handleAction("remind")}
                  disabled={actionLoading === "remind"}
                  className={`w-full mt-3 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    invoice.derived_status === "overdue"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {actionLoading === "remind"
                    ? "Sending..."
                    : "Send Reminder"}
                </button>
              )}
            </div>
          )}

          {/* Activity timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">
              Activity
            </h3>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">No activity yet</p>
            ) : (
              <div className="space-y-0">
                {events.map((evt, i) => (
                  <div key={evt.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <EventIcon type={evt.type} />
                      {i < events.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {eventLabel(evt.type)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatRelativeDate(evt.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-2">
            <button
              onClick={() => handleAction("duplicate")}
              disabled={actionLoading === "duplicate"}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            {!isPaid && !isVoid && (
              <button
                onClick={() => handleAction("void")}
                disabled={actionLoading === "void"}
                className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Void Invoice
              </button>
            )}
            <button
              onClick={() => handleAction("delete")}
              disabled={actionLoading === "delete"}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const base =
    "w-6 h-6 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "created":
      return (
        <div className={`${base} bg-gray-100 dark:bg-gray-800`}>
          <FileText className="w-3 h-3 text-gray-500" />
        </div>
      );
    case "sent":
      return (
        <div className={`${base} bg-blue-100 dark:bg-blue-900/50`}>
          <Send className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        </div>
      );
    case "viewed":
      return (
        <div className={`${base} bg-amber-100 dark:bg-amber-900/50`}>
          <Eye className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </div>
      );
    case "payment_started":
      return (
        <div className={`${base} bg-violet-100 dark:bg-violet-900/50`}>
          <CreditCard className="w-3 h-3 text-violet-600 dark:text-violet-400" />
        </div>
      );
    case "paid":
      return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/50`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        </div>
      );
    case "reminder_sent":
      return (
        <div className={`${base} bg-orange-100 dark:bg-orange-900/50`}>
          <Bell className="w-3 h-3 text-orange-600 dark:text-orange-400" />
        </div>
      );
    case "voided":
      return (
        <div className={`${base} bg-red-100 dark:bg-red-900/50`}>
          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
        </div>
      );
    default:
      return (
        <div className={`${base} bg-gray-100 dark:bg-gray-800`}>
          <Clock className="w-3 h-3 text-gray-500" />
        </div>
      );
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case "created":
      return "Invoice created";
    case "sent":
      return "Invoice sent to client";
    case "viewed":
      return "Client viewed invoice";
    case "payment_started":
      return "Payment initiated";
    case "paid":
      return "Payment confirmed";
    case "reminder_sent":
      return "Reminder sent";
    case "voided":
      return "Invoice voided";
    default:
      return type;
  }
}
