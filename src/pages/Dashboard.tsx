import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Invoice, DashboardStats } from "../types";
import { fetchInvoices, fetchStats } from "../lib/api";
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusLabel } from "../lib/format";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [inv, st] = await Promise.all([fetchInvoices(), fetchStats()]);
        setInvoices(inv);
        setStats(st);
      } catch (e: any) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm text-red-600 dark:text-red-400 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your invoices and track payments</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Invoice
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(stats.total_revenue)} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Paid" value={String(stats.paid_count)} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Pending" value={String(stats.pending_count)} accent="text-blue-600 dark:text-blue-400" />
          <StatCard
            label="Overdue"
            value={String(stats.overdue_count)}
            accent={stats.overdue_count > 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}
          />
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-5xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No invoices yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first invoice and start getting paid instantly.</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3 font-medium">Invoice #</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Description</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Date</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{inv.client_name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                      {inv.description}
                    </td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/invoice/${inv.id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats && stats.recent_payments.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.recent_payments.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{p.client_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(p.payment_timestamp)}</p>
                </div>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(p.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
