"use client";

import { useEffect, useState, useCallback } from "react";

interface HeatmapData {
  matrix: number[][];
  normalized: number[][];
  totalClicks: number;
  maxCount: number;
  peakTime: {
    day: string;
    hour: number;
    clicks: number;
  };
  days: number;
  dayLabels: string[];
  hourLabels: string[];
}

interface ClickHeatmapProps {
  campaignId?: string;
  days?: number;
}

function getHeatColor(value: number): string {
  if (value === 0) return "bg-gray-100 dark:bg-gray-800";
  if (value < 0.15) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (value < 0.3) return "bg-emerald-200 dark:bg-emerald-800/50";
  if (value < 0.45) return "bg-emerald-300 dark:bg-emerald-700/60";
  if (value < 0.6) return "bg-yellow-300 dark:bg-yellow-700/60";
  if (value < 0.75) return "bg-orange-300 dark:bg-orange-600/60";
  if (value < 0.9) return "bg-orange-400 dark:bg-orange-500/70";
  return "bg-red-500 dark:bg-red-500/80";
}

export default function ClickHeatmap({ campaignId, days = 30 }: ClickHeatmapProps) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(days);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: selectedDays.toString() });
      if (campaignId) params.set("campaignId", campaignId);

      const res = await fetch(`/api/tracking-links/analytics/heatmap?${params}`);
      if (!res.ok) throw new Error("Failed to load heatmap data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId, selectedDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const formatHour = (h: number) => {
    if (h === 0) return "12a";
    if (h < 12) return h + "a";
    if (h === 12) return "12p";
    return (h - 12) + "p";
  };

  // Show every 3rd hour label to avoid crowding
  const visibleHours = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Heatmap
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click distribution by day and hour
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedDays === d
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total clicks: </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {data.totalClicks.toLocaleString()}
          </span>
        </div>
        {data.peakTime.clicks > 0 && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Peak: </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {data.peakTime.day} at {data.hourLabels[data.peakTime.hour]}
            </span>
            <span className="text-gray-400 dark:text-gray-500 ml-1">
              ({data.peakTime.clicks} clicks)
            </span>
          </div>
        )}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour labels */}
          <div className="flex ml-16 mb-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] text-gray-400 dark:text-gray-500"
              >
                {visibleHours.includes(h) ? formatHour(h) : ""}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {data.dayLabels.map((dayName, dayIdx) => (
            <div key={dayName} className="flex items-center mb-[2px]">
              {/* Day label */}
              <div className="w-16 text-right pr-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {dayName.slice(0, 3)}
              </div>
              {/* Hour cells */}
              <div className="flex flex-1 gap-[2px]">
                {Array.from({ length: 24 }, (_, hourIdx) => {
                  const count = data.matrix[dayIdx][hourIdx];
                  const norm = data.normalized[dayIdx][hourIdx];
                  const isHovered =
                    hoveredCell?.day === dayIdx && hoveredCell?.hour === hourIdx;

                  return (
                    <div
                      key={hourIdx}
                      className={`flex-1 aspect-square rounded-sm ${getHeatColor(norm)} transition-all cursor-pointer ${
                        isHovered ? "ring-2 ring-blue-500 scale-110 z-10" : ""
                      }`}
                      onMouseEnter={() => setHoveredCell({ day: dayIdx, hour: hourIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${dayName} ${data.hourLabels[hourIdx]}: ${count} clicks`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Color legend */}
          <div className="flex items-center justify-end mt-3 gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            <span>Less</span>
            {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((v) => (
              <div
                key={v}
                className={`w-3 h-3 rounded-sm ${getHeatColor(v)}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip for hovered cell */}
      {hoveredCell && (
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          {data.dayLabels[hoveredCell.day]} at{" "}
          {data.hourLabels[hoveredCell.hour]}:{" "}
          <span className="font-semibold">
            {data.matrix[hoveredCell.day][hoveredCell.hour]} clicks
          </span>
        </div>
      )}
    </div>
  );
}
