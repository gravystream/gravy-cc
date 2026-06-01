"use client";

import { useEffect, useState } from "react";

interface AudienceCountry {
  country: string;
  countryCode: string | null;
  flag: string;
  count: number;
}

interface AudienceBucket {
  label: string;
  count: number;
}

interface AudienceProfile {
  totalClicks: number;
  uniqueVisitors: number;
  countries: AudienceCountry[];
  devices: AudienceBucket[];
  browsers: AudienceBucket[];
  hourOfDay: number[];
  windowDays: number;
}

interface Props {
  creatorId: string;
  windowDays?: number;
}

export default function AudienceInsights({ creatorId, windowDays = 30 }: Props) {
  const [audience, setAudience] = useState<AudienceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/creators/${creatorId}/audience?days=${windowDays}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load audience insights");
        return r.json();
      })
      .then((data) => setAudience(data.audience))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [creatorId, windowDays]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
        Loading audience…
      </div>
    );
  }
  if (error || !audience) {
    return null;
  }

  if (audience.totalClicks === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white">Audience</h3>
        <p className="text-sm text-gray-500 mt-2">
          No click data yet for this creator.
        </p>
      </div>
    );
  }

  const peakHour = audience.hourOfDay.reduce(
    (peak, count, hour) => (count > peak.count ? { hour, count } : peak),
    { hour: 0, count: 0 }
  );
  const maxHour = Math.max(...audience.hourOfDay, 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Audience</h3>
        <p className="text-sm text-gray-400 mt-1">
          From {audience.totalClicks.toLocaleString()} clicks ({audience.uniqueVisitors.toLocaleString()} unique) over the last {audience.windowDays} days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top countries */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Top countries</h4>
          {audience.countries.length === 0 ? (
            <p className="text-sm text-gray-500">No location data</p>
          ) : (
            <div className="space-y-2">
              {audience.countries.map((c) => (
                <div
                  key={c.country}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-gray-200">
                    <span className="text-base">{c.flag}</span>
                    {c.country}
                  </span>
                  <span className="text-gray-300">
                    {c.count.toLocaleString()}
                    <span className="text-gray-500 text-xs ml-1">
                      ({((c.count / audience.totalClicks) * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Device split</h4>
          {audience.devices.length === 0 ? (
            <p className="text-sm text-gray-500">No device data</p>
          ) : (
            <div className="space-y-2">
              {audience.devices.map((d) => {
                const pct = (d.count / audience.totalClicks) * 100;
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-200 capitalize">{d.label}</span>
                      <span className="text-gray-300">
                        {d.count.toLocaleString()}
                        <span className="text-gray-500 text-xs ml-1">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-violet-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Browser split */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Browsers</h4>
        {audience.browsers.length === 0 ? (
          <p className="text-sm text-gray-500">No browser data</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {audience.browsers.map((b) => (
              <div
                key={b.label}
                className="bg-black/30 border border-gray-800 rounded-lg px-3 py-2"
              >
                <p className="text-xs text-gray-400">{b.label}</p>
                <p className="text-sm text-white font-medium">
                  {b.count.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hour of day heatmap */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3">
          Time of day (UTC)
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          Peak activity at {peakHour.hour.toString().padStart(2, "0")}:00 UTC
          ({peakHour.count.toLocaleString()} clicks)
        </p>
        <div className="grid grid-cols-12 md:grid-cols-24 gap-0.5">
          {audience.hourOfDay.map((count, hour) => {
            const intensity = count / maxHour;
            const bg =
              intensity === 0
                ? "bg-gray-800"
                : intensity < 0.25
                ? "bg-violet-900/40"
                : intensity < 0.5
                ? "bg-violet-700/60"
                : intensity < 0.75
                ? "bg-violet-500/80"
                : "bg-violet-400";
            return (
              <div
                key={hour}
                title={`${hour.toString().padStart(2, "0")}:00 — ${count} clicks`}
                className={`aspect-square rounded ${bg}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  );
}
