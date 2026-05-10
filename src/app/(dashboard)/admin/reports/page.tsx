"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReportRow {
  id: string;
  weekStart: string;
  headline: string;
  generatedBy: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reports");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const generateNow = async () => {
    if (
      !confirm(
        "Generate a report for last week now? This calls Claude and may take ~10s."
      )
    )
      return;
    try {
      setGenerating(true);
      setError(null);
      const res = await fetch("/api/admin/reports", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly AI Reports</h1>
          <p className="text-sm text-gray-400 mt-1">
            Auto-generated executive summaries from the previous week's
            metrics. Cron writes a fresh report every Monday at 06:00 UTC.
          </p>
        </div>
        <button
          onClick={generateNow}
          disabled={generating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate now"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No reports yet — try "Generate now" or wait for the Monday cron.
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="block p-6 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Week of {new Date(r.weekStart).toLocaleDateString()}
                    </p>
                    <span className="text-xs text-gray-500 font-mono">
                      {r.generatedBy}
                    </span>
                  </div>
                  <p className="text-white mt-2">{r.headline}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
