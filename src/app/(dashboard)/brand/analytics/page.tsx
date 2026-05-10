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
  Briefcase,
  Star,
  CreditCard,
  FileText,
  Package,
} from "lucide-react";

interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

interface TrackingStats {
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
  topCreators: { name: string; clicks: number; conversions: number }[];
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  pendingEscrow: number;
  avgRating: number;
  totalProposals: number;
  recentCampaigns: { id: string; title: string; status: string; budget: number; createdAt: string }[];
  monthlySpend: { month: string; amount: number }[];
}

type TabType = "tracking" | "campaigns";

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

function SpendChart({ data }: { data: { month: string; amount: number }[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-medium text-gray-300">Monthly Spend</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No spend data yet</p>
      ) : (
        <>
          <div className="flex items-end gap-2 h-32">
            {data.map((d) => (
              <div key={d.month} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                <div className="hidden group-hover:block absolute -top-4 md:p-8 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {d.month}: ${d.amount.toLocaleString()}
                </div>
                <div
                  className="w-full bg-green-500/80 rounded-t-sm min-h-[2px] transition-all hover:bg-green-400"
                  style={{ height: `${(d.amount / maxAmount) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{data[0]?.month}</span>
            <span>{data[data.length - 1]?.month}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function BrandAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tracking");
  const [campaignData, setCampaignData] = useState<CampaignStats | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [campaignRes, trackingRes] = await Promise.all([
          fetch("/api/brand/analytics"),
          fetch("/api/brand/tracking-analytics"),
        ]);

        if (campaignRes.ok) {
          const cData = await campaignRes.json();
          setCampaignData(cData);
        }

        if (trackingRes.ok) {
          const tData = await trackingRes.json();
          // Process tracking data into breakdowns
          const allClicks = tData.clicks || [];
          const totalClicks = tData.totalClicks || 0;
          const uniqueClicks = tData.uniqueClicks || 0;
          const totalConversions = tData.totalConversions || 0;
          const totalRevenue = tData.totalRevenue || 0;

          const buildBreakdown = (field: string): BreakdownItem[] => {
            const counts: Record<string, number> = {};
            for (const click of allClicks) {
              const val = click[field] || "Unknown";
              counts[val] = (counts[val] || 0) + 1;
            }
            const total = allClicks.length || 1;
            return Object.entries(counts)
              .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / total) * 100),
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 8);
          };

          // Clicks over last 30 days
          const clicksOverTime: { date: string; clicks: number }[] = [];
          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            clicksOverTime.push({ date: d.toISOString().split("T")[0], clicks: 0 });
          }
          for (const click of allClicks) {
            const dateStr = new Date(click.timestamp).toISOString().split("T")[0];
            const entry = clicksOverTime.find((e) => e.date === dateStr);
            if (entry) entry.clicks++;
          }

          // Top creators by clicks
          const creatorMap: Record<string, { name: string; clicks: number; conversions: number }> = {};
          for (const link of tData.links || []) {
            const creatorName = link.creator?.name || link.creator?.creatorProfile?.displayName || "Unknown";
            if (!creatorMap[creatorName]) {
              creatorMap[creatorName] = { name: creatorName, clicks: 0, conversions: 0 };
            }
            creatorMap[creatorName].clicks += link.totalClicks || 0;
            creatorMap[creatorName].conversions += link._count?.conversions || 0;
          }

          setTrackingData({
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
            topCreators: Object.values(creatorMap).sort((a, b) => b.clicks - a.clicks).slice(0, 10),
          });
        }
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
      <div className="p-6 space-y-6">
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
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "tracking", label: "Link Performance", icon: MousePointerClick },
    { id: "campaigns", label: "Campaign Overview", icon: Briefcase },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-400 mt-1">
          Track link performance, audience insights, and campaign spend
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-800/30 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tracking Performance Tab */}
      {activeTab === "tracking" && trackingData && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-violet-400" />
                <p className="text-sm text-gray-400">Total Clicks</p>
              </div>
              <p className="text-3xl font-bold mt-2">{trackingData.totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-gray-400">Unique Visitors</p>
              </div>
              <p className="text-3xl font-bold mt-2">{trackingData.uniqueClicks.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-green-400" />
                <p className="text-sm text-gray-400">Conversions</p>
              </div>
              <p className="text-3xl font-bold mt-2">{trackingData.totalConversions.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{trackingData.conversionRate.toFixed(1)}% rate</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-gray-400">Revenue from Links</p>
              </div>
              <p className="text-3xl font-bold mt-2">${trackingData.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Clicks Over Time */}
          <ClicksChart data={trackingData.clicksOverTime} />

          {/* Breakdowns */}
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-4">
            <BreakdownCard title="Devices" icon={Monitor} items={trackingData.deviceBreakdown} />
            <BreakdownCard title="Browsers" icon={Compass} items={trackingData.browserBreakdown} />
            <BreakdownCard title="Countries" icon={Globe} items={trackingData.countryBreakdown} />
            <BreakdownCard title="Referrers" icon={Link2} items={trackingData.referrerBreakdown} />
          </div>

          {/* Top Creators by Performance */}
          {trackingData.topCreators.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-medium text-gray-300">Top Creators by Clicks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-700/50">
                      <th className="pb-2 font-medium">Creator</th>
                      <th className="pb-2 font-medium text-right">Clicks</th>
                      <th className="pb-2 font-medium text-right">Conversions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingData.topCreators.map((c) => (
                      <tr key={c.name} className="border-b border-gray-700/30">
                        <td className="py-2.5 text-gray-300">{c.name}</td>
                        <td className="py-2.5 text-right text-gray-300">{c.clicks.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-green-400">{c.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Click Activity Heatmap</h2>
            <ClickHeatmap />
          </div>
        </div>
      )}

      {/* Campaign Overview Tab */}
      {activeTab === "campaigns" && campaignData && (
        <div className="space-y-6">
          {/* Campaign Stats Cards */}
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400" />
                <p className="text-sm text-gray-400">Total Campaigns</p>
              </div>
              <p className="text-3xl font-bold mt-2">{campaignData.totalCampaigns}</p>
              <p className="text-xs text-green-400 mt-1">{campaignData.activeCampaigns} active</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-400" />
                <p className="text-sm text-gray-400">Total Spent</p>
              </div>
              <p className="text-3xl font-bold mt-2">${campaignData.totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-gray-400">In Escrow</p>
              </div>
              <p className="text-3xl font-bold mt-2">${campaignData.pendingEscrow.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-gray-400">Proposals Received</p>
              </div>
              <p className="text-3xl font-bold mt-2">{campaignData.totalProposals}</p>
            </div>
          </div>

          {/* Monthly Spend */}
          <SpendChart data={campaignData.monthlySpend || []} />

          {/* Recent Campaigns */}
          {campaignData.recentCampaigns && campaignData.recentCampaigns.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-medium text-gray-300">Recent Campaigns</h3>
              </div>
              <div className="space-y-3">
                {campaignData.recentCampaigns.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-300">{c.title}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">${c.budget?.toLocaleString() || 0}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          c.status === "ACTIVE"
                            ? "bg-green-900/30 text-green-400"
                            : c.status === "COMPLETED"
                            ? "bg-blue-900/30 text-blue-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {c.status?.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Activity Heatmap</h2>
            <ClickHeatmap />
          </div>
        </div>
      )}

      {/* Fallback for tracking tab with no data */}
      {activeTab === "tracking" && !trackingData && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 md:p-8 text-center">
          <MousePointerClick className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-gray-300 font-medium">No tracking data yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Once your campaigns have active tracking links, performance data will appear here.
          </p>
        </div>
      )}

      {activeTab === "campaigns" && !campaignData && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 md:p-8 text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-gray-300 font-medium">No campaign data yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Create your first campaign to start seeing analytics here.
          </p>
        </div>
      )}
    </div>
  );
}
