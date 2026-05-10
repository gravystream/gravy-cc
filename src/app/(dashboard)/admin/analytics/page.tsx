"use client";

import { useState, useEffect } from "react";
import ClickHeatmap from "@/components/tracking/ClickHeatmap";
import { ArrowUp } from "lucide-react";

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  createdAt: string;
  campaign?: { title: string; id: string } | null;
  creator?: { displayName: string } | null;
  conversions?: Array<{ revenue: number }>;
}

export default function AdminAnalyticsPage() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/tracking-links");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setLinks(data.links || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, l) => sum + (l.totalClicks || 0), 0),
    totalConversions: links.reduce((sum, l) => sum + (l.conversions?.length || 0), 0),
    totalRevenue: links.reduce((sum, l) => sum + (l.conversions?.reduce((s, c) => s + (c.revenue || 0), 0) || 0), 0),
  };

  const campaignMap = new Map();
  links.forEach((link) => {
    const cId = link.campaign?.id || "uncategorized";
    const cTitle = link.campaign?.title || "Uncategorized";
    const existing = campaignMap.get(cId) || { title: cTitle, clicks: 0, conversions: 0, links: 0 };
    existing.clicks += link.totalClicks || 0;
    existing.conversions += link.conversions?.length || 0;
    existing.links += 1;
    campaignMap.set(cId, existing);
  });
  const campaigns = Array.from(campaignMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.clicks - a.clicks);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-gray-400 mt-1">Overview of all tracking link performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <p className="text-sm text-gray-400">Total Links</p>
          <p className="text-3xl font-bold mt-1">{stats.totalLinks.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <p className="text-sm text-gray-400">Total Clicks</p>
          <p className="text-3xl font-bold mt-1">{stats.totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <p className="text-sm text-gray-400">Total Conversions</p>
          <p className="text-3xl font-bold mt-1">{stats.totalConversions.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">
            {"\u20A6"}{stats.totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <ClickHeatmap days={30} />

      {/* Top Campaigns */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 md:p-8 text-center text-gray-400">
            No campaign data yet.
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto -mx-2 px-2"><table className="w-full min-w-full max-w-[600px]">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Campaign</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Links</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Clicks</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 10).map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                    <td className="p-4 font-medium text-sm">{campaign.title}</td>
                    <td className="p-4 text-right text-sm">{campaign.links}</td>
                    <td className="p-4 text-right text-sm">{campaign.clicks.toLocaleString()}</td>
                    <td className="p-4 text-right text-sm">{campaign.conversions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}
      </div>
    </div>
  );
}
