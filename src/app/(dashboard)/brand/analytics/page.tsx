"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalCampaigns: number;
    statusCounts: Record<string, number>;
    totalSpend: number;
    completionRate: number;
    avgCompletionDays: number;
  };
  ratings: {
    avgRating: number;
    totalReviews: number;
    topCreators: { id: string; name: string; image: string | null; avgRating: number; jobCount: number }[];
    uniqueCreators: number;
  };
  spend: {
    totalEscrowed: number;
    totalReleased: number;
    totalRefunded: number;
    history: { month: string; amount: number }[];
    byCampaign: { id: string; title: string; amount: number; status: string }[];
  };
  activity: {
    recentCampaigns: { id: string; title: string; status: string; updatedAt: string }[];
    recentProposals: { id: string; campaignTitle: string; status: string; createdAt: string }[];
    recentDeliverables: { id: string; creatorName: string; createdAt: string }[];
  };
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + "d ago";
  return new Date(date).toLocaleDateString();
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-300",
  ACTIVE: "bg-green-900/30 text-green-400",
  REVIEWING: "bg-yellow-900/30 text-yellow-400",
  IN_PROGRESS: "bg-blue-900/30 text-blue-400",
  COMPLETED: "bg-emerald-900/30 text-emerald-400",
  CANCELLED: "bg-red-900/30 text-red-400",
};

const escrowStatusColors: Record<string, string> = {
  PENDING_DEPOSIT: "text-gray-400",
  FUNDED: "text-blue-400",
  HELD: "text-yellow-400",
  RELEASED: "text-green-400",
  REFUNDED: "text-red-400",
  DISPUTED: "text-orange-400",
};

export default function BrandAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/brand/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A843]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/brand" className="text-[#D4A843] hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }


  const maxSpend = Math.max(...(data.spend.history.map((h) => h.amount)), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Track your campaign performance and spending</p>
        </div>
        <Link href="/brand" className="text-sm text-[#D4A843] hover:text-[#b8922e] transition">
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total Campaigns</p>
          <p className="text-3xl font-bold text-white mt-2">{data.overview.totalCampaigns}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(data.overview.statusCounts).map(([status, count]) => (
              <span key={status} className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[status] || "bg-gray-700 text-gray-300")}>
                {count} {status.replace("_", " ").toLowerCase()}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total Spend</p>
          <p className="text-3xl font-bold text-white mt-2">{formatNaira(data.overview.totalSpend)}</p>
          <p className="text-gray-500 text-xs mt-2">Released payments</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Completion Rate</p>
          <p className="text-3xl font-bold text-white mt-2">{data.overview.completionRate}%</p>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
            <div className="bg-[#D4A843] h-2 rounded-full transition-all" style={{ width: data.overview.completionRate + "%" }}></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Avg. Completion Time</p>
          <p className="text-3xl font-bold text-white mt-2">{data.overview.avgCompletionDays}</p>
          <p className="text-gray-500 text-xs mt-2">days from brief to approval</p>
        </div>
      </div>

      {/* Creator Ratings + Spend Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Creator Ratings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Creator Ratings</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4A843]">{data.ratings.avgRating}</p>
              <p className="text-gray-400 text-xs">Avg Rating</p>
              <div className="flex justify-center mt-1">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={s <= Math.round(data.ratings.avgRating) ? "text-[#D4A843]" : "text-gray-600"}>&#9733;</span>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{data.ratings.totalReviews}</p>
              <p className="text-gray-400 text-xs">Reviews Given</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{data.ratings.uniqueCreators}</p>
              <p className="text-gray-400 text-xs">Creators Hired</p>
            </div>
          </div>
          {data.ratings.topCreators.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Top Creators</p>
              <div className="space-y-2">
                {data.ratings.topCreators.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-medium">
                        {c.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-gray-500 text-xs">{c.jobCount} job{c.jobCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#D4A843]">&#9733;</span>
                      <span className="text-white text-sm font-medium">{c.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.ratings.topCreators.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No creator ratings yet</p>
          )}
        </div>

        {/* Spend Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Spend Summary</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{formatNaira(data.spend.totalEscrowed)}</p>
              <p className="text-gray-400 text-xs">Total Escrowed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{formatNaira(data.spend.totalReleased)}</p>
              <p className="text-gray-400 text-xs">Released</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{formatNaira(data.spend.totalRefunded)}</p>
              <p className="text-gray-400 text-xs">Refunded</p>
            </div>
          </div>

          {/* Spend by Campaign */}
          {data.spend.byCampaign.length > 0 ? (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">By Campaign</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.spend.byCampaign.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{c.title}</p>
                      <span className={"text-xs " + (escrowStatusColors[c.status] || "text-gray-400")}>{c.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-white text-sm font-medium ml-3">{formatNaira(c.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No spend data yet</p>
          )}
        </div>
      </div>

      {/* Monthly Spend Chart */}
      {data.spend.history.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Spend</h2>
          <div className="flex items-end gap-2 h-48">
            {data.spend.history.map((h) => {
              const height = Math.max((h.amount / maxSpend) * 100, 4);
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-400">{formatNaira(h.amount)}</p>
                  <div className="w-full bg-[#D4A843]/80 rounded-t-md transition-all hover:bg-[#D4A843]" style={{ height: height + "%" }}></div>
                  <p className="text-xs text-gray-500 mt-1">{h.month.slice(5)}/{h.month.slice(2, 4)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Campaigns</h2>
          {data.activity.recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {data.activity.recentCampaigns.map((c) => (
                <div key={c.id} className="border-b border-gray-800 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium truncate">{c.title}</p>
                    <span className={"px-2 py-0.5 rounded-full text-xs " + (statusColors[c.status] || "bg-gray-700 text-gray-300")}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{timeAgo(c.updatedAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No campaigns yet</p>
          )}
        </div>

        {/* Recent Proposals */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Proposals</h2>
          {data.activity.recentProposals.length > 0 ? (
            <div className="space-y-3">
              {data.activity.recentProposals.map((p) => (
                <div key={p.id} className="border-b border-gray-800 pb-3 last:border-0">
                  <p className="text-white text-sm truncate">{p.campaignTitle}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{p.status.replace("_", " ")}</span>
                    <span className="text-xs text-gray-500">{timeAgo(p.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No proposals yet</p>
          )}
        </div>

        {/* Recent Deliverables */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Deliverables</h2>
          {data.activity.recentDeliverables.length > 0 ? (
            <div className="space-y-3">
              {data.activity.recentDeliverables.map((d) => (
                <div key={d.id} className="border-b border-gray-800 pb-3 last:border-0">
                  <p className="text-white text-sm">{d.creatorName || "Creator"}</p>
                  <p className="text-gray-500 text-xs mt-1">Submitted {timeAgo(d.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No deliverables yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
