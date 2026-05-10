"use client";

import { useEffect, useState } from "react";

interface UnitEconomicsResponse {
  windowDays: number;
  metrics: {
    cacKobo: number;
    arpuKobo: number;
    ltvKobo: number;
    retentionMonths: number;
    viralCoefficient: number;
  };
  raw: {
    spendKobo: number;
    revenueKobo: number;
    signups: number;
    activeUsers: number;
    referrals: number;
  };
  series: {
    signups: number[];
    revenueKobo: number[];
  };
  sinceDate: string;
}

function buildSparkline(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const WINDOW_OPTIONS = [30, 60, 90, 180];

export default function AdminUnitEconomicsPage() {
  const [data, setData] = useState<UnitEconomicsResponse | null>(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load(days);
  }, [days]);

  const load = async (windowDays: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/unit-economics?days=${windowDays}`);
      if (!res.ok) throw new Error("Failed to load unit economics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-12">
        Loading unit economics…
      </div>
    );
  }

  const m = data?.metrics;
  const raw = data?.raw;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Unit Economics</h1>
          <p className="text-sm text-gray-400 mt-1">
            CAC, ARPU, LTV, viral coefficient over the selected window.
          </p>
        </div>
        <div className="flex gap-2">
          {WINDOW_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                days === w
                  ? "border-purple-500 text-white bg-purple-500/20"
                  : "border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Top-line metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">CAC</p>
          <p className="text-3xl font-bold text-white mt-2">
            {m ? `₦${(m.cacKobo / 100).toLocaleString()}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₦{raw ? (raw.spendKobo / 100).toLocaleString() : "0"} spend ÷ {raw?.signups ?? 0} signups
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">ARPU</p>
          <p className="text-3xl font-bold text-white mt-2">
            {m ? `₦${(m.arpuKobo / 100).toLocaleString()}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₦{raw ? (raw.revenueKobo / 100).toLocaleString() : "0"} revenue ÷ {raw?.activeUsers ?? 0} active
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">LTV</p>
          <p className="text-3xl font-bold text-white mt-2">
            {m ? `₦${(m.ltvKobo / 100).toLocaleString()}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ARPU × {m?.retentionMonths ?? 6} months retention (env-tunable)
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Viral coefficient</p>
          <p className="text-3xl font-bold text-white mt-2">
            {m ? m.viralCoefficient.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            referrals ÷ signups (referrals: {raw?.referrals ?? 0})
          </p>
        </div>
      </div>

      {/* Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Signups — daily</p>
          <p className="text-2xl font-bold text-white mt-2">
            {raw?.signups.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-gray-500 mb-3">total over window</p>
          <svg viewBox="0 0 400 80" className="w-full" preserveAspectRatio="none">
            <path
              d={buildSparkline(data?.series.signups ?? [], 400, 80)}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={2}
            />
          </svg>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">
            Revenue (₦) — daily
          </p>
          <p className="text-2xl font-bold text-white mt-2">
            ₦{((raw?.revenueKobo ?? 0) / 100).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mb-3">total over window</p>
          <svg viewBox="0 0 400 80" className="w-full" preserveAspectRatio="none">
            <path
              d={buildSparkline(data?.series.revenueKobo ?? [], 400, 80)}
              fill="none"
              stroke="#34d399"
              strokeWidth={2}
            />
          </svg>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Set <code className="bg-black/40 px-1 py-0.5 rounded">GRAVY_AVG_RETENTION_MONTHS</code> to override LTV's retention assumption (default 6).
      </p>
    </div>
  );
}
