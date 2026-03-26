"use client";
import { useEffect, useState } from "react";

interface ConfigItem { key: string; value: string; description: string; isDefault: boolean; }

const labels: Record<string, string> = {
  commission_rate: "Commission Rate (%)",
  ai_quality_threshold: "AI Portfolio Quality Threshold (0-100)",
  ai_proposal_threshold: "AI Proposal Quality Threshold (0-100)",
  auto_release_hours: "Auto-Release Payment (hours)",
  min_payout_amount: "Minimum Payout (kobo)",
  max_revisions: "Max Revisions Per Job",
};

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Unauthorized - admin access required" : "Failed to load config");
        return r.json();
      })
      .then((d) => {
        if (Array.isArray(d)) setConfigs(d);
        else throw new Error("Invalid response format");
        setLoading(false);
      })
      .catch((err) => { setError(err.message || "Failed to load configuration"); setLoading(false); });
  }, []);

  const handleChange = (key: string, value: string) =>
    setConfigs((prev) => prev.map((c) => (c.key === key ? { ...c, value, isDefault: false } : c)));

  const handleSave = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: configs.map((c) => ({ key: c.key, value: c.value })) }),
      });
      if (res.ok) {
        setMessage("Configuration saved successfully!");
        const data = await fetch("/api/admin/config").then((r) => r.json());
        if (Array.isArray(data)) setConfigs(data);
      } else setMessage("Failed to save configuration.");
    } catch { setMessage("Error saving configuration."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Platform Configuration</h1><p>Loading...</p></div>;

  if (error) return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Platform Configuration</h1>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Configuration</h1>
        <p className="text-gray-500 mt-1">Manage commission rates, AI thresholds, and payout settings</p>
      </div>
      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.key} className="border rounded-lg p-4 bg-white">
            <label className="block font-medium text-sm mb-1">
              {labels[config.key] || config.key}
              {config.isDefault && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">default</span>}
            </label>
            <p className="text-xs text-gray-400 mb-2">{config.description}</p>
            <input type="text" value={config.value} onChange={(e) => handleChange(config.key, e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {message && <span className={message.includes("success") ? "text-green-600" : "text-red-600"}>{message}</span>}
      </div>
    </div>
  );
}
