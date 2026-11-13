import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import type { Profile } from "../types";
import { fetchProfile, updateProfile, resetDemo } from "../lib/api";
import { useAppStore } from "../stores/app";

export default function AppSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast, setProfile: storeSetProfile } = useAppStore();

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      storeSetProfile(updated);
      addToast({ type: "success", title: "Settings saved" });
    } catch {
      addToast({ type: "info", title: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo();
      addToast({ type: "success", title: "Demo data reset" });
      window.location.reload();
    } catch {
      addToast({ type: "info", title: "Reset failed" });
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Business Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business Name" value={profile.business_name} onChange={(v) => setProfile({ ...profile, business_name: v })} />
          <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
          <Field label="Address" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} />
          <Field label="City" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
          <Field label="Country" value={profile.country} onChange={(v) => setProfile({ ...profile, country: v })} />
          <Field label="Invoice Prefix" value={profile.invoice_prefix} onChange={(v) => setProfile({ ...profile, invoice_prefix: v })} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Payout</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="NEAR Wallet" value={profile.payout_wallet} onChange={(v) => setProfile({ ...profile, payout_wallet: v })} placeholder="yourname.near" />
          <Field label="Settle Asset" value={profile.settle_asset} onChange={(v) => setProfile({ ...profile, settle_asset: v })} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Invoice Defaults</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Terms (days)</label>
            <input type="number" value={profile.default_terms_days} onChange={(e) => setProfile({ ...profile, default_terms_days: Number(e.target.value) || 30 })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Tax Rate (%)</label>
            <input type="number" value={profile.default_tax_rate} onChange={(e) => setProfile({ ...profile, default_tax_rate: Number(e.target.value) || 0 })} className="input-field" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Demo Data</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Reset all data to the default demo state.</p>
        <button onClick={handleReset} className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Reset demo data</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );
}
