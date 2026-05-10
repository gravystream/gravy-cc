"use client";

import { useEffect, useState } from "react";
import ClickHeatmap from "@/components/tracking/ClickHeatmap";

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  expiresAt: string | null;
  maxClicks: number | null;
  createdAt: string;
  campaign: { title: string } | null;
  _count: { conversions: number };
  clicks?: Array<{
    id: string;
    country?: string;
    device?: string;
    browser?: string;
    os?: string;
    referrer?: string;
    timestamp: string;
  }>;
}

interface AnalyticsResponse {
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    totalRevenue: number;
  };
  links: Array<any>;
  clicksOverTime: Array<{ date: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  countryBreakdown: Array<{ country: string; count: number }>;
}

export default function CreatorLinksPageV2() {
  const [activeTab, setActiveTab] = useState<"overview" | "links">("overview");
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, linksRes] = await Promise.all([
        fetch("/api/creator/analytics"),
        fetch("/api/creator/tracking-links"),
      ]);

      if (!analyticsRes.ok || !linksRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const analyticsData = await analyticsRes.json();
      const linksData = await linksRes.json();

      setAnalytics(analyticsData);
      setLinks(linksData.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      setToggling(linkId);
      const res = await fetch("/api/creator/tracking-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId, isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setLinks((prev) =>
        prev.map((link) =>
          link.id === linkId ? { ...link, isActive: !currentStatus } : link
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const exportCSV = () => {
    if (links.length === 0) return;
    const headers = [
      "Short Code",
      "Campaign",
      "Destination URL",
      "Total Clicks",
      "Unique Clicks",
      "Conversions",
      "Status",
      "Created",
    ];
    const rows = links.map((link) => [
      link.shortCode,
      link.campaign?.title || "N/A",
      link.destinationUrl,
      link.totalClicks || 0,
      link.uniqueClicks || 0,
      link._count?.conversions || 0,
      link.isActive ? "Active" : "Inactive",
      new Date(link.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creator-links-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
  };

  const fmt = (n: number | undefined | null) => (n ?? 0).toLocaleString();

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg md:text-2xl font-bold text-white">My Links</h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={"px-4 py-2 font-medium transition-colors " + (
            activeTab === "overview"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={"px-4 py-2 font-medium transition-colors " + (
            activeTab === "links"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          Links
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid stagger-children grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <p className="text-gray-400 text-sm font-medium">Total Clicks</p>
              <p className="text-xl md:text-3xl font-bold text-white mt-2">
                {fmt(summary?.totalClicks)}
              </p>
            </div>
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <p className="text-gray-400 text-sm font-medium">Unique Clicks</p>
              <p className="text-xl md:text-3xl font-bold text-white mt-2">
                {fmt(summary?.uniqueClicks)}
              </p>
            </div>
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <p className="text-gray-400 text-sm font-medium">Conversions</p>
              <p className="text-xl md:text-3xl font-bold text-white mt-2">
                {fmt(summary?.totalConversions)}
              </p>
            </div>
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <p className="text-gray-400 text-sm font-medium">Revenue</p>
              <p className="text-xl md:text-3xl font-bold text-green-400 mt-2">
                {"$" + (summary?.totalRevenue ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Clicks Over Time */}
          {analytics?.clicksOverTime && analytics.clicksOverTime.length > 0 && (
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
              <h3 className="text-white font-semibold mb-4">Clicks Over Time (Last 7 Days)</h3>
              <div className="flex items-end gap-1 h-40">
                {analytics.clicksOverTime.map((d, i) => {
                  const max = Math.max(...analytics.clicksOverTime.map((x) => x.count), 1);
                  const h = (d.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{d.count}</span>
                      <div
                        className="w-full bg-purple-600 rounded-t"
                        style={{ height: Math.max(h, 4) + "%" }}
                      />
                      <span className="text-xs text-gray-600 truncate w-full text-center">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breakdowns */}
          <div className="grid stagger-children grid-cols-1 md:grid-cols-3 gap-4">
            {analytics?.deviceBreakdown && analytics.deviceBreakdown.length > 0 && (
              <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
                <h3 className="text-white font-semibold mb-3">Devices</h3>
                {analytics.deviceBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-400">{d.device || "Unknown"}</span>
                    <span className="text-white font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
            {analytics?.browserBreakdown && analytics.browserBreakdown.length > 0 && (
              <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
                <h3 className="text-white font-semibold mb-3">Browsers</h3>
                {analytics.browserBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-400">{d.browser || "Unknown"}</span>
                    <span className="text-white font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
            {analytics?.countryBreakdown && analytics.countryBreakdown.length > 0 && (
              <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-4 md:p-6">
                <h3 className="text-white font-semibold mb-3">Countries</h3>
                {analytics.countryBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-400">{d.country || "Unknown"}</span>
                    <span className="text-white font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links Tab */}
      {activeTab === "links" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-white">
              All Links ({links.length})
            </h2>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              Export CSV
            </button>
          </div>

          <div className="space-y-2">
            {links.length === 0 ? (
              <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-4 md:p-8 text-center text-gray-400">
                No links yet
              </div>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                >
                  {/* Link Row */}
                  <div className="flex items-center justify-between flex-wrap gap-2 p-4 hover:bg-gray-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setExpandedLink(
                              expandedLink === link.id ? null : link.id
                            )
                          }
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <span className={"inline-block transition-transform " + (expandedLink === link.id ? "rotate-180" : "")}>
                            â¼
                          </span>
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium truncate">
                              {link.campaign?.title || link.shortCode}
                            </p>
                            <span className="text-xs text-gray-500 font-mono">
                              {link.shortCode}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm truncate">
                            {link.destinationUrl}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Clicks</p>
                        <p className="text-white font-bold">
                          {fmt(link.totalClicks)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Unique</p>
                        <p className="text-white font-bold">
                          {fmt(link.uniqueClicks)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Conv.</p>
                        <p className="text-white font-bold">
                          {fmt(link._count?.conversions)}
                        </p>
                      </div>

                      {/* Status Badge & Toggle */}
                      <div className="flex items-center gap-2">
                        <span
                          className={"px-3 py-1 rounded-full text-xs font-medium " + (
                            link.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-700 text-gray-400"
                          )}
                        >
                          {link.isActive ? "Active" : "Inactive"}
                        </span>
                        <button
                          onClick={() =>
                            handleToggleStatus(link.id, link.isActive)
                          }
                          disabled={toggling === link.id}
                          className={"px-3 py-1 rounded text-xs font-medium transition " + (
                            link.isActive
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          ) + (toggling === link.id ? " opacity-50" : "")}
                        >
                          {toggling === link.id ? "..." : link.isActive ? "Pause" : "Activate"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLink === link.id && (
                    <div className="border-t border-gray-800 bg-gray-900/50 p-4 space-y-4">
                      <div className="grid stagger-children grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Short Code</p>
                          <p className="text-sm text-white font-mono">{link.shortCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm text-white">{new Date(link.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Expires</p>
                          <p className="text-sm text-white">{link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Max Clicks</p>
                          <p className="text-sm text-white">{link.maxClicks ?? "Unlimited"}</p>
                        </div>
                      </div>

                      {link.clicks && link.clicks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">
                            Recent Clicks ({link.clicks.length})
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 text-left border-b border-gray-800">
                                  <th className="pb-2 pr-4 font-medium">Device</th>
                                  <th className="pb-2 pr-4 font-medium">Browser</th>
                                  <th className="pb-2 pr-4 font-medium">Country</th>
                                  <th className="pb-2 pr-4 font-medium">OS</th>
                                  <th className="pb-2 font-medium">Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {link.clicks.slice(0, 10).map((click) => (
                                  <tr key={click.id} className="text-gray-400 border-t border-gray-800/50">
                                    <td className="py-2 pr-4">{click.device || "Unknown"}</td>
                                    <td className="py-2 pr-4">{click.browser || "Unknown"}</td>
                                    <td className="py-2 pr-4">{click.country || "Unknown"}</td>
                                    <td className="py-2 pr-4">{click.os || "Unknown"}</td>
                                    <td className="py-2 text-xs">{new Date(click.timestamp).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        
      {/* Activity Heatmap */}
      <div className="mt-8">
        <ClickHeatmap days={30} />
      </div>
    </div>
      )}
    </div>
  );
}
