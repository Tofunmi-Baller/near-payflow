import { getStatusColor, getStatusLabel } from "../../lib/format";
import type { DerivedStatus } from "../../types";

interface BadgeProps {
  status: DerivedStatus | string;
  className?: string;
}

export function Badge({ status, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)} ${className}`}
    >
      {(status === "sent" || status === "viewed") && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
