"use client";

import { useEffect, useState } from "react";

interface Snapshot {
  id: string;
  date: string;
  totalGravyCreators: number;
  activeGravyCreators: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenueKobo: number;
  newSignups: number;
}

interface TopPerformer {
  creatorId: string;
  displayName: string;
  avatarUrl: string | null;
  tier: string;
  conversionsThisWeek: number;
}

interface KpiResponse {
  today: Snapshot | null;
  snapshots: Snapshot[];
  topPerformers: TopPerformer[];
  weekStart: string;
}

const TIER_BADGE: Record<string, string> = {
  BRONZE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  SILVER: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  GOLD: "bg-yellow-900/40 text-yellow-300 border-yellow-600/40",
  PLATINUM: "bg-purple-900/40 text-purple-200 border-purple-500/40",
};

type MetricKey =
  | "totalClicks"
  | "totalConversions"
  | "totalRevenueKobo"
  | "activeGravyCreators";

const METRICS: Array<{ key: MetricKey; label: string; format: (n: number) => string; color: string }> = [
  { key: "totalClicks", label: "Clicks (24h)", format: (n) => n.toLocaleString(), color: "#a78bfa" },
  { key: "totalConversions", label: "Conversions (24h)", format: (n) => n.toLocaleString(), color: "#34d399" },
  { key: "totalRevenueKobo", label: "Revenue (₦, 24h)", format: (n) => `₦${(n / 100).toLocaleString()}`, color: "#fbbf24" },
  { key: "activeGravyCreators", label: "Active creators (7d)", format: (n) => n.toLocaleString(), color: "#60a5fa" },
];

function buildPath(values: number[], width: number, height: number): string {
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

export default function AdminKpiPage() {
  const [data, setData] = useState<KpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("totalClicks");

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/kpi");
      if (!res.ok) throw new Error("Failed to load KPI dashboard");
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
      <div className="text-center text-gray-400 py-12">Loading KPIs…</div>
    );
  }

  const today = data?.today;
  const snapshots = data?.snapshots ?? [];
  const topPerformers = data?.topPerformers ?? [];
  const series = snapshots.map((s) => s[selectedMetric] as number);
  const chartWidth = 800;
  const chartHeight = 200;
  const path = buildPath(series, chartWidth, chartHeight);
  const selectedMetricMeta = METRICS.find((m) => m.key === selectedMetric)!;
  const max = Math.max(...series, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gravy KPI Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Daily snapshots of the Gravy Army's reach. Cron writes a fresh
          snapshot at 02:00 UTC.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.key}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-gray-400 text-sm font-medium">{m.label}</p>
            <p className="text-3xl font-bold text-white mt-2">
              {today ? m.format(today[m.key] as number) : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {today ? new Date(today.date).toLocaleDateString() : "no data yet"}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 text-sm font-medium">Total Gravy creators</p>
        <p className="text-3xl font-bold text-white mt-2">
          {today ? today.totalGravyCreators.toLocaleString() : "—"}
        </p>
      </div>

      {/* Trend chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <h3 className="text-lg font-semibold text-white flex-1">
            30-day trend
          </h3>
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                selectedMetric === m.key
                  ? "border-purple-500 text-white bg-purple-500/20"
                  : "border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {series.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No snapshots yet — the daily cron hasn't run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
              className="w-full max-w-full"
              preserveAspectRatio="none"
            >
              <line
                x1={0}
                x2={chartWidth}
                y1={chartHeight}
                y2={chartHeight}
                stroke="#374151"
                strokeWidth={1}
              />
              <path
                d={path}
                fill="none"
                stroke={selectedMetricMeta.color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {series.map((v, i) => {
                const x =
                  series.length === 1
                    ? 0
                    : (i * chartWidth) / (series.length - 1);
                const y = chartHeight - (v / max) * chartHeight;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={selectedMetricMeta.color}
                  />
                );
              })}
            </svg>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>
                {snapshots[0] &&
                  new Date(snapshots[0].date).toLocaleDateString()}
              </span>
              <span>
                Peak: {selectedMetricMeta.format(max)}
              </span>
              <span>
                {snapshots[snapshots.length - 1] &&
                  new Date(
                    snapshots[snapshots.length - 1].date
                  ).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top 10 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            Top 10 this week
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Gravy Army creators ranked by conversions since{" "}
            {data?.weekStart
              ? new Date(data.weekStart).toLocaleDateString()
              : "Monday"}
            .
          </p>
        </div>
        {topPerformers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No conversions this week
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4 w-12">
                    #
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Creator
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Tier
                  </th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">
                    Conversions
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((p, i) => {
                  const tierClass = TIER_BADGE[p.tier] ?? TIER_BADGE.BRONZE;
                  return (
                    <tr
                      key={p.creatorId}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.avatarUrl}
                              alt={p.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <span className="text-white">{p.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${tierClass}`}
                        >
                          {p.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold">
                        {p.conversionsThisWeek.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
