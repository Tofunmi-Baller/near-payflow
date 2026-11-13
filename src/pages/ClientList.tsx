import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, MapPin } from "lucide-react";
import type { Client } from "../types";
import { fetchClients } from "../lib/api";
import { formatCurrency, getInitials, getAvatarColor } from "../lib/format";

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clients
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No clients yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Clients are added when you create invoices
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              to={`/app/clients/${client.id}`}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${getAvatarColor(client.name)}`}
                >
                  {getInitials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {client.contact_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                <MapPin className="w-3 h-3" />
                {client.city}, {client.country}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Billed
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(client.total_billed || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Paid
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(client.total_paid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Invoices
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {client.invoice_count || 0}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
