"use client";

import { useState, useEffect } from "react";
import ClickHeatmap from "@/components/tracking/ClickHeatmap";
import {
  BarChart3,
  MousePointerClick,
  Users,
  DollarSign,
  Globe,
  Monitor,
  Compass,
  TrendingUp,
  ArrowUpRight,
  Link2,
} from "lucide-react";

interface ClickData {
  timestamp: string;
  device: string;
  browser: string;
  country: string;
  referrer: string;
}

interface ConversionData {
  id: string;
  type: string;
  value: number;
  timestamp: string;
}

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  createdAt: string;
  campaign?: { title: string } | null;
  clicks: ClickData[];
  conversions: ConversionData[];
  _count?: { conversions: number };
}

interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  links: TrackingLink[];
  totalClicks: number;
  uniqueClicks: number;
  totalConversions: number;
  totalRevenue: number;
  deviceBreakdown: BreakdownItem[];
  browserBreakdown: BreakdownItem[];
  countryBreakdown: BreakdownItem[];
  referrerBreakdown: BreakdownItem[];
  clicksOverTime: { date: string; clicks: number }[];
  conversionRate: number;
}

function computeAnalytics(links: TrackingLink[]): AnalyticsData {
  let totalClicks = 0;
  let uniqueClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;
  const allClicks: ClickData[] = [];
  const allConversions: ConversionData[] = [];

  for (const link of links) {
    totalClicks += link.totalClicks;
    uniqueClicks += link.uniqueClicks;
    totalConversions += link._count?.conversions || link.conversions?.length || 0;
    totalRevenue += (link.conversions || []).reduce((s, c) => s + (c.value || 0), 0);
    allClicks.push(...(link.clicks || []));
    allConversions.push(...(link.conversions || []));
  }

  const buildBreakdown = (field: keyof ClickData): BreakdownItem[] => {
    const counts: Record<string, number> = {};
    for (const click of allClicks) {
      const val = click[field] || "Unknown";
      counts[val] = (counts[val] || 0) + 1;
    }
    const total = allClicks.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  // Clicks over last 30 days
  const clicksOverTime: { date: string; clicks: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    clicksOverTime.push({ date: dateStr, clicks: 0 });
  }
  for (const click of allClicks) {
    const dateStr = new Date(click.timestamp).toISOString().split("T")[0];
    const entry = clicksOverTime.find((e) => e.date === dateStr);
    if (entry) entry.clicks++;
  }

  return {
    links,
    totalClicks,
    uniqueClicks,
    totalConversions,
    totalRevenue,
    deviceBreakdown: buildBreakdown("device"),
    browserBreakdown: buildBreakdown("browser"),
    countryBreakdown: buildBreakdown("country"),
    referrerBreakdown: buildBreakdown("referrer"),
    clicksOverTime,
    conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
  };
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: BreakdownItem[];
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No data yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300 truncate max-w-[160px]">{item.name}</span>
                <span className="text-gray-400">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                <div
                  className="bg-violet-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClicksChart({ data }: { data: { date: string; clicks: number }[] }) {
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-medium text-gray-300">Clicks Over Time (30 Days)</h3>
      </div>
      <div className="flex items-end gap-[2px] h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 group relative flex flex-col items-center justify-end h-full">
            <div className="hidden group-hover:block absolute -top-4 md:p-8 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {d.date}: {d.clicks} clicks
            </div>
            <div
              className="w-full bg-violet-500/80 rounded-t-sm min-h-[2px] transition-all hover:bg-violet-400"
              style={{ height: `${(d.clicks / maxClicks) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

function ConversionTimeline({ conversions }: { conversions: ConversionData[] }) {
  const sorted = [...conversions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const recent = sorted.slice(0, 10);

  if (recent.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-medium text-gray-300">Recent Conversions</h3>
        </div>
        <p className="text-gray-500 text-sm">No conversions yet. When brands set up conversion tracking, your earnings from clicks will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-medium text-gray-300">Recent Conversions</h3>
      </div>
      <div className="space-y-3">
        {recent.map((c) => (
          <div key={c.id} className="flex items-center justify-between flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full capitalize">
                {c.type || "conversion"}
              </span>
              <span className="text-gray-400">
                {new Date(c.timestamp).toLocaleDateString()}
              </span>
            </div>
            {c.value > 0 && (
              <span className="text-green-400 font-medium">
                +${c.value.toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreatorAnalyticsPage() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/creator/analytics");
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setLinks(data.links || data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-lg" />
            ))}
          </div>
          <div className="h-48 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const analytics = computeAnalytics(links);
  const allConversions = links.flatMap((l) => l.conversions || []);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-lg md:text-2xl font-bold">Analytics</h1>
        <p className="text-gray-400 mt-1">
          Track your link performance, audience insights, and conversions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-violet-400" />
            <p className="text-sm text-gray-400">Total Clicks</p>
          </div>
          <p className="text-xl md:text-3xl font-bold mt-2">{analytics.totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Unique Visitors</p>
          </div>
          <p className="text-xl md:text-3xl font-bold mt-2">{analytics.uniqueClicks.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">Conversions</p>
          </div>
          <p className="text-xl md:text-3xl font-bold mt-2">{analytics.totalConversions.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.conversionRate.toFixed(1)}% rate</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-gray-400">Revenue</p>
          </div>
          <p className="text-xl md:text-3xl font-bold mt-2">${analytics.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Clicks Over Time */}
      <ClicksChart data={analytics.clicksOverTime} />

      {/* Breakdowns Grid */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownCard title="Devices" icon={Monitor} items={analytics.deviceBreakdown} />
        <BreakdownCard title="Browsers" icon={Compass} items={analytics.browserBreakdown} />
        <BreakdownCard title="Countries" icon={Globe} items={analytics.countryBreakdown} />
        <BreakdownCard title="Referrers" icon={Link2} items={analytics.referrerBreakdown} />
      </div>

      {/* Conversions Timeline */}
      <ConversionTimeline conversions={allConversions} />

      {/* Heatmap */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Activity Heatmap</h2>
        <ClickHeatmap />
      </div>

      {/* Top Performing Links */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-medium text-gray-300">Top Performing Links</h3>
        </div>
        {links.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No tracking links yet. When a brand approves your deliverable, your tracking link will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-700/50">
                  <th className="pb-2 font-medium">Campaign</th>
                  <th className="pb-2 font-medium">Link</th>
                  <th className="pb-2 font-medium text-right">Clicks</th>
                  <th className="pb-2 font-medium text-right">Unique</th>
                  <th className="pb-2 font-medium text-right">Conversions</th>
                  <th className="pb-2 font-medium text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {[...links]
                  .sort((a, b) => b.totalClicks - a.totalClicks)
                  .slice(0, 10)
                  .map((link) => {
                    const convCount = link._count?.conversions || link.conversions?.length || 0;
                    const rate = link.totalClicks > 0 ? ((convCount / link.totalClicks) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={link.id} className="border-b border-gray-700/30">
                        <td className="py-2.5 text-gray-300 max-w-[150px] truncate">
                          {link.campaign?.title || "—"}
                        </td>
                        <td className="py-2.5 text-violet-400 font-mono text-xs">
                          /go/{link.shortCode}
                        </td>
                        <td className="py-2.5 text-right text-gray-300">
                          {link.totalClicks.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-gray-400">
                          {link.uniqueClicks.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-green-400">
                          {convCount}
                        </td>
                        <td className="py-2.5 text-right text-gray-400">
                          {rate}%
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
