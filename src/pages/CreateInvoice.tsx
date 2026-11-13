import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LineItem, CreateInvoicePayload } from "../types";
import { createInvoice } from "../lib/api";
import { formatCurrency } from "../lib/format";

const emptyLineItem = (): LineItem => ({ description: "", quantity: 1, rate: 0, amount: 0 });

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [freelancerName, setFreelancerName] = useState("");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [freelancerWallet, setFreelancerWallet] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      item.amount = item.quantity * item.rate;
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const canSubmit =
    freelancerName.trim() &&
    clientName.trim() &&
    dueDate &&
    lineItems.some((li) => li.description.trim() && li.rate > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const payload: CreateInvoicePayload = {
      freelancer_name: freelancerName.trim(),
      freelancer_email: freelancerEmail.trim(),
      freelancer_wallet: freelancerWallet.trim() || "demo.testnet",
      client_name: clientName.trim(),
      client_email: clientEmail.trim(),
      description: description.trim(),
      line_items: lineItems.filter((li) => li.description.trim() && li.rate > 0),
      tax_rate: taxRate,
      due_date: dueDate,
      currency,
    };

    try {
      const invoice = await createInvoice(payload);
      navigate(`/invoice/${invoice.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create invoice");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Invoice</h1>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Freelancer details */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Your Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your Name *" value={freelancerName} onChange={setFreelancerName} placeholder="Jane Smith" />
              <Field label="Your Email" value={freelancerEmail} onChange={setFreelancerEmail} placeholder="jane@example.com" type="email" />
              <Field
                label="NEAR Wallet"
                value={freelancerWallet}
                onChange={setFreelancerWallet}
                placeholder="yourname.testnet"
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Client details */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Client Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Client Name *" value={clientName} onChange={setClientName} placeholder="Acme Corp" />
              <Field label="Client Email" value={clientEmail} onChange={setClientEmail} placeholder="billing@acme.com" type="email" />
            </div>
          </div>

          {/* Invoice details */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Invoice Details</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Description" value={description} onChange={setDescription} placeholder="Web development services — November 2026" className="sm:col-span-2" />
              <Field label="Due Date *" value={dueDate} onChange={setDueDate} type="date" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Line Items</h2>
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onChange={(e) => updateLineItem(i, "quantity", Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Rate ($)"
                      value={item.rate || ""}
                      onChange={(e) => updateLineItem(i, "rate", Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="w-24 py-2 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </div>
                  <button
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length <= 1}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addLineItem}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Line Item
            </button>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center gap-3 justify-end">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tax Rate (%)</span>
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
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tax ({taxRate}%)</span>
                  <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : (
              "Create & Send Invoice"
            )}
          </button>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Live Preview</h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">PF</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">PayFlow</span>
                </div>
                <span className="text-xs text-gray-400">INVOICE</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div>
                  <p className="text-gray-400 mb-1">From</p>
                  <p className="font-medium text-gray-900 dark:text-white">{freelancerName || "Your Name"}</p>
                  {freelancerEmail && <p className="text-gray-500">{freelancerEmail}</p>}
                </div>
                <div>
                  <p className="text-gray-400 mb-1">To</p>
                  <p className="font-medium text-gray-900 dark:text-white">{clientName || "Client Name"}</p>
                  {clientEmail && <p className="text-gray-500">{clientEmail}</p>}
                </div>
              </div>

              {description && <p className="text-gray-600 dark:text-gray-300 mb-4 text-xs">{description}</p>}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                {lineItems
                  .filter((li) => li.description)
                  .map((li, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {li.description} <span className="text-gray-400">× {li.quantity}</span>
                      </span>
                      <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(li.amount)}</span>
                    </div>
                  ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax ({taxRate}%)</span>
                    <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                </div>
              </div>

              {dueDate && (
                <p className="mt-4 text-xs text-gray-400">
                  Due: {new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}

              <div className="mt-6 bg-brand-600 text-white text-center py-2.5 rounded-lg text-xs font-semibold">
                Pay Now
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
      />
    </div>
  );
}
