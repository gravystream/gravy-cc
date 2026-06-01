"use client";

import { useEffect, useState } from "react";

interface FlywheelMetric {
  id: string;
  date: string;
  signups: number;
  activations: number;
  transactions: number;
  referrals: number;
  signupToActivation: number;
  activationToTransaction: number;
  transactionToReferral: number;
  referralToSignup: number;
}

interface FlywheelResponse {
  today: FlywheelMetric | null;
  metrics: FlywheelMetric[];
  totals: {
    signups: number;
    activations: number;
    transactions: number;
    referrals: number;
  };
}

const STAGES: Array<{
  key: keyof FlywheelResponse["totals"];
  label: string;
  color: string;
  description: string;
}> = [
  { key: "signups", label: "Signups", color: "bg-blue-500", description: "New User rows" },
  { key: "activations", label: "Activations", color: "bg-violet-500", description: "Created creator/brand profile" },
  { key: "transactions", label: "Transactions", color: "bg-green-500", description: "Conversions recorded" },
  { key: "referrals", label: "Referrals", color: "bg-amber-500", description: "Referrals generated (placeholder)" },
];

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
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

export default function AdminFlywheelPage() {
  const [data, setData] = useState<FlywheelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/flywheel");
      if (!res.ok) throw new Error("Failed to load flywheel");
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
      <div className="text-center text-gray-400 py-12">Loading flywheel…</div>
    );
  }

  const today = data?.today;
  const metrics = data?.metrics ?? [];
  const totals = data?.totals ?? {
    signups: 0,
    activations: 0,
    transactions: 0,
    referrals: 0,
  };

  const maxStage = Math.max(...STAGES.map((s) => totals[s.key]), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Flywheel Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">
          Signups → Activations → Transactions → Referrals. Cron writes a daily
          snapshot at 03:00 UTC.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Today's stage cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map((s) => (
          <div
            key={s.key}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-gray-400 text-sm font-medium">{s.label} (today)</p>
            <p className="text-3xl font-bold text-white mt-2">
              {today ? today[s.key].toLocaleString() : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">{s.description}</p>
          </div>
        ))}
      </div>

      {/* 30d funnel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white">30-day funnel</h3>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          Cumulative volume per stage across the last 30 days, with stage-to-stage conversion rates.
        </p>
        <div className="space-y-3">
          {STAGES.map((s, i) => {
            const value = totals[s.key];
            const widthPct = (value / maxStage) * 100;
            const next = STAGES[i + 1];
            const conversionRate =
              next && data?.today
                ? today
                  ? ratioForStage(today, s.key, next.key)
                  : 0
                : null;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-200">{s.label}</span>
                  <span className="text-gray-300 font-semibold">
                    {value.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${s.color} flex items-center px-3 text-white text-xs font-medium`}
                    style={{ width: `${Math.max(widthPct, 4)}%` }}
                  >
                    {value.toLocaleString()}
                  </div>
                </div>
                {next && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    ↓ today's rate: {conversionRate != null ? formatPercent(conversionRate) : "—"} → {next.label}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 30d trend lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAGES.map((s) => {
          const series = metrics.map((m) => m[s.key]);
          const max = Math.max(...series, 1);
          const path = buildSparkline(series, 400, 80);
          return (
            <div
              key={s.key}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <h4 className="text-sm text-gray-400 mb-2">{s.label} — 30d</h4>
              <div className="flex items-end justify-between gap-3">
                <p className="text-2xl font-bold text-white">
                  {totals[s.key].toLocaleString()}
                </p>
                <span className="text-xs text-gray-500">peak {max.toLocaleString()}</span>
              </div>
              {series.length === 0 ? (
                <p className="text-xs text-gray-500 mt-3">No snapshots yet</p>
              ) : (
                <svg
                  viewBox="0 0 400 80"
                  className="w-full mt-3"
                  preserveAspectRatio="none"
                >
                  <path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-violet-400"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ratioForStage(
  today: FlywheelMetric,
  from: string,
  to: string
): number | null {
  const key =
    from === "signups" && to === "activations"
      ? "signupToActivation"
      : from === "activations" && to === "transactions"
      ? "activationToTransaction"
      : from === "transactions" && to === "referrals"
      ? "transactionToReferral"
      : null;
  if (!key) return null;
  return (today as any)[key] as number;
}
