import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Mail, Plus } from "lucide-react";
import type { Client, Invoice } from "../types";
import { fetchClient } from "../lib/api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getInitials,
  getAvatarColor,
} from "../lib/format";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<(Client & { invoices: Invoice[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchClient(id)
      .then(setClient)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Client not found</p>
        <Link to="/app/clients" className="text-brand-600 dark:text-brand-400 text-sm hover:underline mt-2 inline-block">
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/clients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Clients
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${getAvatarColor(client.name)}`}
          >
            {getInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {client.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {client.contact_name}
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
              {client.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {client.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {client.city}, {client.country}
              </span>
            </div>
          </div>
          <Link
            to={`/app/invoices/new?client=${client.id}`}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Total Billed
            </p>
            <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white mt-1">
              {formatCurrency(client.total_billed || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Total Paid
            </p>
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(client.total_paid || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Outstanding
            </p>
            <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(client.outstanding || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Invoices
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {client.invoice_count || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Invoices
          </h2>
        </div>
        {client.invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No invoices for this client yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {client.invoices.map((inv) => (
              <Link
                key={inv.id}
                to={`/app/invoices/${inv.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    <span className="font-mono text-xs text-brand-600 dark:text-brand-400 mr-2">
                      {inv.invoice_number}
                    </span>
                    {inv.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(inv.issue_date)} · Due{" "}
                    {formatDate(inv.due_date)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(inv.total)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${getStatusColor(inv.derived_status)}`}
                  >
                    {getStatusLabel(inv.derived_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
