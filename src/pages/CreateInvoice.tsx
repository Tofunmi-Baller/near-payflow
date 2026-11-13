import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  X,
  FileText,
  Send,
  Save,
  Sparkles,
} from "lucide-react";
import type { LineItem, CreateInvoicePayload, Profile, Client } from "../types";
import { createInvoice, fetchProfile, fetchClients } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";

const TERMS_PRESETS = [
  { label: "Due on Receipt", days: 0 },
  { label: "Net 15", days: 15 },
  { label: "Net 30", days: 30 },
];

const emptyLineItem = (): LineItem => ({
  description: "",
  quantity: 1,
  rate: 0,
  amount: 0,
});

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get("client") || "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(preselectedClient);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [termsDays, setTermsDays] = useState(30);
  const [dueDate, setDueDate] = useState(addDays(30));
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchClients()]).then(([p, c]) => {
      setProfile(p);
      setClients(c);
      setTaxRate(p.default_tax_rate);
      setTermsDays(p.default_terms_days);
      setDueDate(addDays(p.default_terms_days));
      if (preselectedClient) setClientId(preselectedClient);
    });
  }, []);

  const selectTerms = (days: number) => {
    setTermsDays(days);
    setDueDate(addDays(days));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      item.amount = item.quantity * item.rate;
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () =>
    setLineItems((prev) => [...prev, emptyLineItem()]);
  const removeLineItem = (i: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const selectedClient = clients.find((c) => c.id === clientId);

  const canSubmit =
    clientId &&
    lineItems.some((li) => li.description.trim() && li.rate > 0) &&
    dueDate;

  const fillSample = () => {
    if (clients.length > 0) setClientId(clients[0].id);
    setDescription("Web development services — November 2026");
    setNotes("Payment via NEAR Intents. Thank you for your business!");
    selectTerms(30);
    setLineItems([
      {
        description: "Frontend development",
        quantity: 40,
        rate: 150,
        amount: 6000,
      },
      {
        description: "API integration & testing",
        quantity: 16,
        rate: 150,
        amount: 2400,
      },
    ]);
  };

  const handleSubmit = async (status: "draft" | "sent") => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const payload: CreateInvoicePayload = {
      client_id: clientId,
      description: description.trim(),
      notes: notes.trim() || undefined,
      line_items: lineItems.filter((li) => li.description.trim() && li.rate > 0),
      tax_rate: taxRate,
      terms_days: termsDays,
      due_date: dueDate,
      currency,
      status,
    };

    try {
      const invoice = await createInvoice(payload);
      navigate(`/app/invoices/${invoice.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create invoice");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/app/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Invoices
        </Link>
        <button
          onClick={fillSample}
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium bg-brand-50 dark:bg-brand-950 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Fill Sample
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        New Invoice
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* From (auto) */}
          {profile && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                From
              </h2>
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile.business_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.email}
              </p>
              <p className="text-xs font-mono text-gray-400 mt-1">
                {profile.payout_wallet} · {profile.settle_asset}
              </p>
            </div>
          )}

          {/* Client selector */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Bill To
            </h2>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.contact_name}
                </option>
              ))}
            </select>
            {selectedClient && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedClient.email} · {selectedClient.city},{" "}
                {selectedClient.country}
              </div>
            )}
          </div>

          {/* Invoice details */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Web development services — November 2026"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Terms
                </label>
                <div className="flex gap-1.5">
                  {TERMS_PRESETS.map((t) => (
                    <button
                      key={t.days}
                      onClick={() => selectTerms(t.days)}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        termsDays === t.days
                          ? "bg-brand-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, thank you notes, etc."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Line Items
            </h2>
            <div className="space-y-2.5">
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(i, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateLineItem(i, "quantity", Number(e.target.value) || 0)
                    }
                    className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Rate"
                    value={item.rate || ""}
                    onChange={(e) =>
                      updateLineItem(i, "rate", Number(e.target.value) || 0)
                    }
                    className="w-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                  <div className="w-24 py-2 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </div>
                  <button
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length <= 1}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addLineItem}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>

            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center gap-3 justify-end">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tax Rate (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRate || ""}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                  className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Tax ({taxRate}%)
                  </span>
                  <span className="tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit("draft")}
              disabled={!canSubmit || submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit("sent")}
              disabled={!canSubmit || submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 px-6 py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Live Preview
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* Invoice header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-[10px]">
                        PF
                      </span>
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      PayFlow
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Invoice
                  </span>
                </div>
              </div>

              <div className="p-5 text-xs space-y-4">
                {/* From / To */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase mb-1">
                      From
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {profile?.business_name || "Your Business"}
                    </p>
                    <p className="text-gray-500">
                      {profile?.email || "email@example.com"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase mb-1">
                      To
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedClient?.name || "Client Name"}
                    </p>
                    <p className="text-gray-500">
                      {selectedClient?.email || "client@example.com"}
                    </p>
                  </div>
                </div>

                {description && (
                  <p className="text-gray-600 dark:text-gray-300">
                    {description}
                  </p>
                )}

                {/* Line items preview */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
                  {lineItems
                    .filter((li) => li.description)
                    .map((li, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-[11px]"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {li.description}{" "}
                          <span className="text-gray-400">× {li.quantity}</span>
                        </span>
                        <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                          {formatCurrency(li.amount)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">
                        Tax ({taxRate}%)
                      </span>
                      <span className="tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {dueDate && (
                  <p className="text-[10px] text-gray-400">
                    Due:{" "}
                    {formatDate(dueDate + "T00:00:00")}
                  </p>
                )}

                {notes && (
                  <p className="text-[10px] text-gray-400 italic">{notes}</p>
                )}

                {/* Fake pay button */}
                <div className="bg-brand-600 text-white text-center py-2.5 rounded-lg text-xs font-semibold">
                  Pay Now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
