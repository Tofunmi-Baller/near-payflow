import { X, CheckCircle, Info, Zap } from "lucide-react";
import { useAppStore } from "../../stores/app";

const icons = {
  success: CheckCircle,
  info: Info,
  payment: Zap,
};

const iconColors = {
  success: "text-emerald-500",
  info: "text-blue-500",
  payment: "text-brand-500",
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-4 flex items-start gap-3 animate-slide-up"
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
