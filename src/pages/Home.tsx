import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
  ArrowRight,
  Send,
  Eye,
  CreditCard,
  CheckCircle2,
  XCircle,
  Bell,
} from "lucide-react";
import type {
  DashboardStats,
  MonthlyRevenue,
  NeedsAttention,
  ActivityItem,
  SSEEvent,
} from "../types";
import {
  fetchStats,
  fetchMonthlyRevenue,
  fetchNeedsAttention,
  fetchActivity,
} from "../lib/api";
import {
  formatCurrency,
  formatRelativeDate,
  formatSettleTime,
  getInitials,
  getAvatarColor,
} from "../lib/format";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [attention, setAttention] = useState<NeedsAttention[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchMonthlyRevenue(),
      fetchNeedsAttention(),
      fetchActivity(),
    ])
      .then(([s, r, a, act]) => {
        setStats(s);
        setRevenue(r);
        setAttention(a);
        setActivity(act);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const evtSource = new EventSource("/api/events");
    evtSource.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        if (event.type === "invoice.paid") {
          fetchStats().then(setStats);
          fetchMonthlyRevenue().then(setRevenue);
          fetchNeedsAttention().then(setAttention);
        }
        setActivity((prev) => [
          {
            id: Date.now(),
            invoice_id: event.invoice_id,
            invoice_number: event.invoice_number,
            client_name: event.client_name,
            type: event.type === "invoice.viewed" ? "viewed" : event.type === "invoice.paid" ? "paid" : "payment_started",
            meta: "{}",
            amount: event.amount,
            created_at: event.timestamp,
          },
          ...prev.slice(0, 19),
        ]);
      } catch {}
    };
    return () => evtSource.close();
  }, []);

  if (loading) return <HomeSkeleton />;

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good morning"
      : today.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPITile
            label="Revenue This Month"
            value={formatCurrency(stats.revenue_this_month)}
            delta={stats.revenue_delta}
            icon={<DollarSign className="w-4 h-4" />}
            color="emerald"
          />
          <KPITile
            label="Outstanding"
            value={formatCurrency(stats.outstanding_amount)}
            sub={`${stats.outstanding_count} invoice${stats.outstanding_count !== 1 ? "s" : ""}`}
            icon={<FileText className="w-4 h-4" />}
            color="blue"
          />
          <KPITile
            label="Overdue"
            value={formatCurrency(stats.overdue_amount)}
            sub={`${stats.overdue_count} invoice${stats.overdue_count !== 1 ? "s" : ""}`}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={stats.overdue_count > 0 ? "red" : "gray"}
          />
          <KPITile
            label="Avg Settlement"
            value={formatSettleTime(stats.avg_settle_seconds)}
            sub="via NEAR Intents"
            icon={<Clock className="w-4 h-4" />}
            color="violet"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {revenue.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Revenue (12 months)
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v: string) => {
                      const [, m] = v.split("-");
                      return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1];
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    width={48}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-3 py-2 rounded-lg shadow-lg">
                          {formatCurrency(payload[0].value as number)}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {attention.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Needs Attention
                </h2>
                <Link
                  to="/app/invoices?status=overdue"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {attention.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/app/invoices/${item.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColor(item.client_name)} text-white`}>
                        {getInitials(item.client_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.invoice_number} · {item.client_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.derived_status === "overdue"
                            ? `${item.days_overdue}d overdue`
                            : item.viewed_at
                              ? `Viewed ${formatRelativeDate(item.viewed_at)}`
                              : `Due ${formatRelativeDate(item.due_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          item.derived_status === "overdue"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                        }`}
                      >
                        {item.derived_status === "overdue" ? "Overdue" : "Viewed"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50 max-h-[480px] overflow-y-auto">
              {activity.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  No activity yet
                </div>
              ) : (
                activity.slice(0, 15).map((item) => (
                  <Link
                    key={item.id}
                    to={`/app/invoices/${item.invoice_id}`}
                    className="flex gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      <ActivityIcon type={item.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{item.client_name}</span>{" "}
                        <span className="text-gray-500 dark:text-gray-400">
                          {activityLabel(item.type)}
                        </span>{" "}
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {item.invoice_number}
                        </span>
                      </p>
                      {item.amount != null && (
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrency(item.amount)}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatRelativeDate(item.created_at)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-5 text-white">
            <h3 className="font-semibold text-sm">Try the demo flow</h3>
            <p className="text-brand-200 text-xs mt-1 leading-relaxed">
              Create an invoice, open the payment link, and watch the dashboard
              update live when payment settles.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                to="/app/invoices/new"
                className="inline-flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Create an invoice
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                to="/app/invoices?status=sent"
                className="inline-flex items-center justify-center gap-1.5 text-brand-200 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Or pay an outstanding one
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPITile({
  label,
  value,
  delta,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  delta?: number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
    red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30",
    gray: "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800",
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl lg:text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
        {value}
      </p>
      {delta != null && (
        <div className="flex items-center gap-1 mt-1">
          {delta >= 0 ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(0)}% vs last month
          </span>
        </div>
      )}
      {sub && !delta && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
      )}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const base = "w-6 h-6 rounded-full flex items-center justify-center";
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
    case "voided":
      return (
        <div className={`${base} bg-red-100 dark:bg-red-900/50`}>
          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
        </div>
      );
    case "reminder_sent":
      return (
        <div className={`${base} bg-orange-100 dark:bg-orange-900/50`}>
          <Bell className="w-3 h-3 text-orange-600 dark:text-orange-400" />
        </div>
      );
    default:
      return (
        <div className={`${base} bg-gray-100 dark:bg-gray-800`}>
          <FileText className="w-3 h-3 text-gray-500" />
        </div>
      );
  }
}

function activityLabel(type: string): string {
  switch (type) {
    case "created": return "created";
    case "sent": return "was sent to";
    case "viewed": return "viewed";
    case "payment_started": return "started payment on";
    case "paid": return "paid";
    case "reminder_sent": return "was reminded about";
    case "voided": return "voided";
    default: return type;
  }
}

function HomeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-72 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    </div>
  );
}
