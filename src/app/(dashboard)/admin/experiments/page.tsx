"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  metric: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "ABANDONED";
  startDate: string | null;
  endDate: string | null;
  sampleSize: number;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  RUNNING: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  COMPLETED: "bg-green-900/40 text-green-300 border-green-700/40",
  ABANDONED: "bg-red-900/40 text-red-300 border-red-800/40",
};

export default function AdminExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hypothesis: "",
    metric: "",
    sampleSize: "",
  });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/experiments");
      if (!res.ok) throw new Error("Failed to load experiments");
      const data = await res.json();
      setExperiments(data.experiments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.hypothesis.trim() || !form.metric.trim()) {
      setError("Name, hypothesis, and metric required");
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const sampleSize = parseInt(form.sampleSize, 10);
      const res = await fetch("/api/admin/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          hypothesis: form.hypothesis,
          metric: form.metric,
          sampleSize: Number.isFinite(sampleSize) ? sampleSize : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create");
      }
      setForm({ name: "", hypothesis: "", metric: "", sampleSize: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Experiment Engine</h1>
        <p className="text-sm text-gray-400 mt-1">
          A/B tests with hypothesis tracking, sample-size targets, and
          structured results.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3"
      >
        <h2 className="text-lg font-semibold text-white">New experiment</h2>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name (e.g. 'Onboarding banner copy')"
          className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
        />
        <textarea
          value={form.hypothesis}
          onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
          placeholder="Hypothesis (e.g. 'Showing payout amounts on signup will increase activation by ≥10%')"
          rows={2}
          className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.metric}
            onChange={(e) => setForm({ ...form, metric: e.target.value })}
            placeholder="Target metric (e.g. 'activation_rate')"
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
          <input
            type="number"
            min={0}
            value={form.sampleSize}
            onChange={(e) => setForm({ ...form, sampleSize: e.target.value })}
            placeholder="Sample size target"
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create experiment"}
        </button>
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : experiments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No experiments yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Name</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Metric</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Sample size</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Started</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Ended</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/experiments/${e.id}`}
                        className="text-white hover:text-violet-400"
                      >
                        {e.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {e.hypothesis}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${STATUS_BADGE[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm font-mono">
                      {e.metric}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300">
                      {e.sampleSize.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {e.startDate
                        ? new Date(e.startDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {e.endDate
                        ? new Date(e.endDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
