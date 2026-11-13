import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  MoreHorizontal,
  Copy,
  Send,
  Trash2,
  ExternalLink,
  Eye,
} from "lucide-react";
import type { Invoice, DerivedStatus } from "../types";
import { fetchInvoices, remindInvoice, voidInvoice, duplicateInvoice } from "../lib/api";
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getStatusColor,
  getStatusLabel,
  getInitials,
  getAvatarColor,
} from "../lib/format";

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Outstanding" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
  { key: "void", label: "Void" },
];

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("q") || "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadInvoices = async () => {
    const params: Record<string, string> = {};
    if (activeTab !== "all") params.status = activeTab;
    if (searchQuery) params.q = searchQuery;
    const data = await fetchInvoices(params);
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadInvoices();
  }, [activeTab, searchQuery]);

  const setTab = (tab: string) => {
    const p = new URLSearchParams(searchParams);
    if (tab === "all") p.delete("status");
    else p.set("status", tab);
    setSearchParams(p);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    if (search.trim()) p.set("q", search.trim());
    else p.delete("q");
    setSearchParams(p);
  };

  const handleAction = async (action: string, inv: Invoice) => {
    setMenuOpen(null);
    switch (action) {
      case "copy": {
        const link = `${window.location.origin}/pay/${inv.id}`;
        await navigator.clipboard.writeText(link);
        break;
      }
      case "remind":
        await remindInvoice(inv.id);
        loadInvoices();
        break;
      case "duplicate": {
        const dup = await duplicateInvoice(inv.id);
        window.location.href = `/app/invoices/${dup.id}`;
        break;
      }
      case "void":
        if (confirm(`Void invoice ${inv.invoice_number}?`)) {
          await voidInvoice(inv.id);
          loadInvoices();
        }
        break;
    }
  };

  const tabCounts = (status: string) => {
    if (status === "all") return invoices.length;
    if (status === "sent")
      return invoices.filter(
        (i) => i.derived_status === "sent" || i.derived_status === "viewed"
      ).length;
    return invoices.filter((i) => i.derived_status === status).length;
  };

  const filtered = invoices.filter((inv) => {
    if (activeTab === "all") return true;
    if (activeTab === "sent")
      return inv.derived_status === "sent" || inv.derived_status === "viewed";
    return inv.derived_status === activeTab;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and track all your invoices
          </p>
        </div>
        <Link
          to="/app/invoices/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
              {!loading && (
                <span className="ml-1.5 text-xs opacity-60">
                  {tabCounts(tab.key)}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
          />
        </form>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {searchQuery
              ? "No matching invoices"
              : activeTab !== "all"
                ? `No ${activeTab} invoices`
                : "No invoices yet"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Create your first invoice to get started"}
          </p>
          {!searchQuery && (
            <Link
              to="/app/invoices/new"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        to={`/app/invoices/${inv.id}`}
                        className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${getAvatarColor(inv.client_name)}`}
                        >
                          {getInitials(inv.client_name)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {inv.client_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={
                          inv.derived_status === "overdue"
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      >
                        {formatRelativeDate(inv.due_date)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(inv.derived_status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inv.derived_status === "paid"
                              ? "bg-emerald-500"
                              : inv.derived_status === "overdue"
                                ? "bg-red-500"
                                : inv.derived_status === "sent"
                                  ? "bg-blue-500"
                                  : inv.derived_status === "viewed"
                                    ? "bg-amber-500"
                                    : "bg-gray-400"
                          }`}
                        />
                        {getStatusLabel(inv.derived_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === inv.id ? null : inv.id);
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      {menuOpen === inv.id && (
                        <RowMenu
                          invoice={inv}
                          onAction={(a) => handleAction(a, inv)}
                          onClose={() => setMenuOpen(null)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((inv) => (
              <Link
                key={inv.id}
                to={`/app/invoices/${inv.id}`}
                className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 active:bg-gray-50 dark:active:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(inv.client_name)}`}
                    >
                      {getInitials(inv.client_name)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {inv.client_name}
                      </p>
                      <p className="font-mono text-xs text-gray-400">
                        {inv.invoice_number}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(inv.derived_status)}`}
                  >
                    {getStatusLabel(inv.derived_status)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Due {formatRelativeDate(inv.due_date)}
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(inv.total)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RowMenu({
  invoice,
  onAction,
  onClose,
}: {
  invoice: Invoice;
  onAction: (action: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      className="absolute right-4 top-10 z-20 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to={`/app/invoices/${invoice.id}`}
        className="flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Eye className="w-3.5 h-3.5" />
        View
      </Link>
      {invoice.derived_status !== "paid" && invoice.derived_status !== "void" && (
        <button
          onClick={() => onAction("copy")}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Payment Link
        </button>
      )}
      {(invoice.derived_status === "sent" || invoice.derived_status === "overdue") && (
        <button
          onClick={() => onAction("remind")}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Send className="w-3.5 h-3.5" />
          Send Reminder
        </button>
      )}
      <button
        onClick={() => onAction("duplicate")}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Copy className="w-3.5 h-3.5" />
        Duplicate
      </button>
      {invoice.derived_status !== "paid" && invoice.derived_status !== "void" && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
          <button
            onClick={() => onAction("void")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Void Invoice
          </button>
        </>
      )}
    </div>
  );
}
