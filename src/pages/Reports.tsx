import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { RevenueByClient, RevenueByToken, AgingBucket } from "../types";
import { fetchRevenueByClient, fetchRevenueByToken, fetchAging } from "../lib/api";
import { formatCurrency } from "../lib/format";

export default function Reports() {
  const [byClient, setByClient] = useState<RevenueByClient[]>([]);
  const [byToken, setByToken] = useState<RevenueByToken[]>([]);
  const [aging, setAging] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRevenueByClient(), fetchRevenueByToken(), fetchAging()])
      .then(([c, t, a]) => {
        setByClient(c);
        setByToken(t);
        setAging(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const TOKEN_COLORS: Record<string, string> = {
    USDC: "#2775CA",
    USDN: "#00C08B",
    NEAR: "#6366f1",
    ETH: "#627EEA",
    BTC: "#F7931A",
  };

  const AGING_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Revenue analytics and insights
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Client */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Revenue by Client
          </h2>
          {byClient.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={byClient.slice(0, 8)}
                layout="vertical"
                margin={{ left: 0, right: 16 }}
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  type="category"
                  dataKey="client_name"
                  axisLine={false}
                  tickLine={false}
                  width={120}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                        {formatCurrency(payload[0].value as number)}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Token */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Payments by Token
          </h2>
          {byToken.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byToken} margin={{ bottom: 0 }}>
                <XAxis
                  dataKey="token"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  width={48}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                        <p className="font-semibold">
                          {formatCurrency(data.amount_usd)}
                        </p>
                        <p className="text-gray-300 text-xs">
                          {data.count} payment{data.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount_usd" radius={[4, 4, 0, 0]}>
                  {byToken.map((entry) => (
                    <Cell
                      key={entry.token}
                      fill={TOKEN_COLORS[entry.token] || "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Receivables Aging */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Receivables Aging
          </h2>
          {aging.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {aging.map((bucket, i) => (
                <div
                  key={bucket.label}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: AGING_COLORS[i] }}
                    />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {bucket.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(bucket.amount)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {bucket.count} invoice{bucket.count !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No data available yet</p>
      </div>
    </div>
  );
}
