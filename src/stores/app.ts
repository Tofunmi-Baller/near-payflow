import { create } from "zustand";
import type { Profile } from "../types";

export interface Toast {
  id: string;
  type: "success" | "info" | "payment";
  title: string;
  description?: string;
  duration?: number;
}

interface AppStore {
  profile: Profile | null;
  outstandingCount: number;
  setProfile: (p: Profile) => void;
  setOutstandingCount: (n: number) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useAppStore = create<AppStore>((set) => ({
  profile: null,
  outstandingCount: 0,
  setProfile: (p) => set({ profile: p }),
  setOutstandingCount: (n) => set({ outstandingCount: n }),
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const dur = toast.duration ?? 5000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, dur);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
