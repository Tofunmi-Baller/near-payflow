import { TrendingUp, TrendingDown } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  delta?: number;
  subtitle?: string;
  className?: string;
}

export function StatTile({ label, value, delta, subtitle, className = "" }: StatTileProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 ${className}`}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
        {value}
      </p>
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {delta >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              delta >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
