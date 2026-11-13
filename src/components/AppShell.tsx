import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Plus,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  MoreHorizontal,
  RotateCcw,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/app";
import { ToastContainer } from "./ui/Toast";
import { fetchProfile, fetchStats, resetDemo } from "../lib/api";

const mainNav = [
  { path: "/app", label: "Home", icon: LayoutDashboard, exact: true },
  { path: "/app/invoices", label: "Invoices", icon: FileText, badge: true },
  { path: "/app/clients", label: "Clients", icon: Users },
  { path: "/app/payments", label: "Payments", icon: ArrowLeftRight },
  { path: "/app/reports", label: "Reports", icon: BarChart3 },
];

const bottomNav = [
  { path: "/app", label: "Home", icon: Home, exact: true },
  { path: "/app/invoices", label: "Invoices", icon: FileText },
  { path: "/app/invoices/new", label: "New", icon: Plus, primary: true },
  { path: "/app/payments", label: "Payments", icon: ArrowLeftRight },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { profile, setProfile, outstandingCount, setOutstandingCount, addToast } =
    useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => {});
    fetchStats()
      .then((s) => setOutstandingCount(s.outstanding_count))
      .catch(() => {});
  }, [setProfile, setOutstandingCount]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (demoRef.current && !demoRef.current.contains(e.target as Node)) {
        setDemoMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleResetDemo = async () => {
    setDemoMenuOpen(false);
    try {
      await resetDemo();
      addToast({ type: "success", title: "Demo data reset", description: "All data has been refreshed" });
      window.location.reload();
    } catch {
      addToast({ type: "info", title: "Reset failed", description: "Could not reset demo data" });
    }
  };

  function isActive(path: string, exact?: boolean) {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-950">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-30">
        <div className="p-5">
          <Link to="/app" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Pay<span className="text-brand-600">Flow</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {mainNav.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="flex-1">{item.label}</span>
                {item.badge && outstandingCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {outstandingCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="my-3 h-px bg-gray-100 dark:bg-gray-800" />

          <Link
            to="/app/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/settings")
                ? "bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            Settings
          </Link>
        </nav>

        <div className="p-3 space-y-3">
          {profile && (
            <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Settles to
                </p>
              </div>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">
                {profile.payout_wallet}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {profile.settle_asset}
              </p>
            </div>
          )}

          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>

          <p className="px-3 text-[10px] text-gray-400 dark:text-gray-600">
            Powered by NEAR Protocol
          </p>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 text-gray-600 dark:text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Pay<span className="text-brand-600">Flow</span>
              </span>
            </Link>
          </div>
          <Link
            to="/app/invoices/new"
            className="bg-brand-600 text-white p-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ── Mobile slide-out menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-2 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-900 dark:text-white">
                Pay<span className="text-brand-600">Flow</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {mainNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.path, item.exact)
                    ? "bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
            <Link
              to="/app/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              <Settings className="w-[18px] h-[18px]" />
              Settings
            </Link>
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 w-full"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-0">
        {/* Top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
          <div />
          <div className="flex items-center gap-3">
            {/* Demo mode pill */}
            <div className="relative" ref={demoRef}>
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Demo
                <ChevronDown className="w-3 h-3" />
              </button>
              {demoMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50">
                  <button
                    onClick={handleResetDemo}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset demo data
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/app/invoices/new"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNav.map((item) => {
            const active = isActive(item.path, item.exact);
            if (item.primary) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center -mt-4 shadow-lg shadow-brand-600/30"
                >
                  <item.icon className="w-5 h-5 text-white" />
                </Link>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                  active
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                moreMenuOpen
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
            {moreMenuOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setMoreMenuOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50">
                  <Link
                    to="/app/clients"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Users className="w-4 h-4" />
                    Clients
                  </Link>
                  <Link
                    to="/app/reports"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Reports
                  </Link>
                  <Link
                    to="/app/settings"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <ToastContainer />
    </div>
  );
}
