"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import WebhookSettings from "@/components/tracking/WebhookSettings";

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  createdAt: string;
}

interface CampaignAnalytics {
  id: string;
  title: string;
  status: string;
  budget?: number;
  links: TrackingLink[];
  breakdowns: {
    device: Record<string, number>;
    browser: Record<string, number>;
    country: Record<string, number>;
  };
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  clicksByDay: Array<{
    date: string;
    clicks: number;
  }>;
}

interface CreatorROI {
  trackingLinkId: string;
  shortCode: string;
  creator: {
    id: string;
    creatorProfileId: string | null;
    displayName: string;
    avatarUrl: string | null;
    tier: string;
    isGravyArmy: boolean;
  };
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  cpaKobo: number;
  revenueKobo: number;
}

type ThresholdType =
  | "CONVERSIONS"
  | "CLICKS"
  | "UNIQUE_CLICKS"
  | "REVENUE_KOBO";

interface CampaignBonus {
  id: string;
  threshold: number;
  thresholdType: ThresholdType;
  bonusAmountKobo: number;
  earnedAt: string | null;
  paidAt: string | null;
  paidManually: boolean;
  notes: string | null;
  creator: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

const TIER_BADGE: Record<string, string> = {
  BRONZE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  SILVER: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  GOLD: "bg-yellow-900/40 text-yellow-300 border-yellow-600/40",
  PLATINUM: "bg-purple-900/40 text-purple-200 border-purple-500/40",
};

export default function BrandCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roi, setRoi] = useState<CreatorROI[]>([]);
  const [roiLoading, setRoiLoading] = useState(true);

  const [bonuses, setBonuses] = useState<CampaignBonus[]>([]);
  const [bonusesLoading, setBonusesLoading] = useState(true);
  const [newBonus, setNewBonus] = useState({
    creatorProfileId: "",
    thresholdType: "CONVERSIONS" as ThresholdType,
    threshold: "",
    bonusAmountNaira: "",
  });
  const [creatingBonus, setCreatingBonus] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignAnalytics();
    fetchPerCreatorRoi();
    fetchBonuses();
  }, [campaignId]);

  const fetchBonuses = async () => {
    try {
      setBonusesLoading(true);
      const res = await fetch(`/api/brand/campaigns/${campaignId}/bonuses`);
      if (!res.ok) return;
      const data = await res.json();
      setBonuses(data.bonuses ?? []);
    } finally {
      setBonusesLoading(false);
    }
  };

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setBonusError(null);

    const threshold = parseInt(newBonus.threshold, 10);
    const naira = parseFloat(newBonus.bonusAmountNaira);
    if (
      !newBonus.creatorProfileId ||
      !Number.isFinite(threshold) ||
      threshold <= 0 ||
      !Number.isFinite(naira) ||
      naira <= 0
    ) {
      setBonusError("Pick a creator and enter positive threshold + amount.");
      return;
    }

    try {
      setCreatingBonus(true);
      const res = await fetch(`/api/brand/campaigns/${campaignId}/bonuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: newBonus.creatorProfileId,
          threshold,
          thresholdType: newBonus.thresholdType,
          bonusAmountKobo: Math.round(naira * 100),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add bonus");
      }
      setNewBonus({
        creatorProfileId: "",
        thresholdType: "CONVERSIONS",
        threshold: "",
        bonusAmountNaira: "",
      });
      await fetchBonuses();
    } catch (err) {
      setBonusError(err instanceof Error ? err.message : "Failed to add bonus");
    } finally {
      setCreatingBonus(false);
    }
  };

  const fetchPerCreatorRoi = async () => {
    try {
      setRoiLoading(true);
      const res = await fetch(
        `/api/brand/campaigns/${campaignId}/per-creator-roi`
      );
      if (!res.ok) return;
      const data = await res.json();
      setRoi(data.perCreator ?? []);
    } catch {
      // non-fatal — campaign analytics still load
    } finally {
      setRoiLoading(false);
    }
  };

  const fetchCampaignAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/brand/campaign-analytics?campaignId=${campaignId}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch campaign analytics");
      }
      const data = await res.json();
      setCampaign(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch campaign analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMaxClicksByDay = () => {
    if (!campaign?.clicksByDay || campaign.clicksByDay.length === 0) return 1;
    return Math.max(...campaign.clicksByDay.map((d) => d.clicks));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading campaign analytics...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-gray-400">Campaign not found</p>
        </div>
      </div>
    );
  }

  const maxClicks = getMaxClicksByDay();

  return (
    <div className="space-y-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-purple-500" />
          Campaign Analytics
        </h1>
        <div className="w-20"></div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Campaign Header */}
      <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{campaign.title}</h2>
            <p className="text-gray-400 mt-2">Campaign ID: {campaign.id}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
            {campaign.status}
          </span>
        </div>
        {campaign.budget && (
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-gray-400 text-sm">Budget</p>
              <p className="text-2xl font-bold text-white">
                ${campaign.budget.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Total Links</p>
          <p className="text-3xl font-bold text-white mt-2">
            {campaign.totalLinks}
          </p>
        </div>
        <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Total Clicks</p>
          <p className="text-3xl font-bold text-white mt-2">
            {campaign.totalClicks.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Conversions</p>
          <p className="text-3xl font-bold text-white mt-2">
            {campaign.totalConversions.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Revenue</p>
          <p className="text-3xl font-bold text-white mt-2">
            ${campaign.totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Clicks Over Time Chart */}
      {campaign.clicksByDay && campaign.clicksByDay.length > 0 && (
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Clicks Over Time
          </h3>
          <div className="flex items-end gap-2 h-48">
            {campaign.clicksByDay.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all hover:from-purple-600 hover:to-purple-500 cursor-pointer group relative"
                    style={{
                      height: `${(day.clicks / maxClicks) * 100}%`,
                      minHeight: day.clicks > 0 ? "4px" : "0px",
                    }}
                  >
                    <div className="absolute -top-4 md:p-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.clicks}
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs text-center">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device/Browser/Country Breakdown */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Device Breakdown
          </h3>
          {Object.keys(campaign.breakdowns.device).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(campaign.breakdowns.device)
                .sort(([, a], [, b]) => b - a)
                .map(([device, count]) => (
                  <div key={device}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-300 text-sm">
                        {device || "Unknown"}
                      </span>
                      <span className="text-white font-semibold">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(count / campaign.totalClicks) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Browser Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Browser Breakdown
          </h3>
          {Object.keys(campaign.breakdowns.browser).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(campaign.breakdowns.browser)
                .sort(([, a], [, b]) => b - a)
                .map(([browser, count]) => (
                  <div key={browser}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-300 text-sm">
                        {browser || "Unknown"}
                      </span>
                      <span className="text-white font-semibold">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(count / campaign.totalClicks) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Country Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Countries
          </h3>
          {Object.keys(campaign.breakdowns.country).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(campaign.breakdowns.country)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([country, count]) => (
                  <div key={country}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-300 text-sm">
                        {country || "Unknown"}
                      </span>
                      <span className="text-white font-semibold">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(count / campaign.totalClicks) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-Creator ROI */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            Per-creator performance
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Sorted by conversions, then clicks. CPA is campaign budget ÷ conversions per creator.
          </p>
        </div>
        {roiLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : roi.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No creator activity yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Creator
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Clicks
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Unique
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Conv
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Conv rate
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    CPA (₦)
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Revenue (₦)
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Tier
                  </th>
                </tr>
              </thead>
              <tbody>
                {roi.map((r) => {
                  const tierClass =
                    TIER_BADGE[r.creator.tier] ?? TIER_BADGE.BRONZE;
                  return (
                    <tr
                      key={r.trackingLinkId}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {r.creator.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.creator.avatarUrl}
                              alt={r.creator.displayName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          )}
                          <span className="text-white">
                            {r.creator.displayName}
                          </span>
                          {r.creator.isGravyArmy && (
                            <span className="text-xs bg-purple-900/40 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded">
                              GRAVY
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{r.clicks}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {r.uniqueClicks}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {r.conversions}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {(r.conversionRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        ₦{(r.cpaKobo / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        ₦{(r.revenueKobo / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${tierClass}`}
                        >
                          {r.creator.tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Bonuses */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Performance bonuses</h3>
          <p className="text-sm text-gray-400 mt-1">
            Configure milestone bonuses per creator. Disbursement is manual —
            see <a href="/brand/bonuses" className="text-blue-400 underline">Bonuses owed</a>.
          </p>
        </div>

        <form onSubmit={handleCreateBonus} className="p-6 border-b border-gray-800 grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={newBonus.creatorProfileId}
            onChange={(e) => setNewBonus((s) => ({ ...s, creatorProfileId: e.target.value }))}
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm md:col-span-2"
          >
            <option value="">Pick a creator…</option>
            {roi
              .filter((r) => r.creator.creatorProfileId)
              .map((r) => (
                <option key={r.creator.creatorProfileId!} value={r.creator.creatorProfileId!}>
                  {r.creator.displayName}
                </option>
              ))}
          </select>
          <select
            value={newBonus.thresholdType}
            onChange={(e) =>
              setNewBonus((s) => ({
                ...s,
                thresholdType: e.target.value as ThresholdType,
              }))
            }
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="CONVERSIONS">Conversions</option>
            <option value="CLICKS">Clicks</option>
            <option value="UNIQUE_CLICKS">Unique clicks</option>
            <option value="REVENUE_KOBO">Revenue (kobo)</option>
          </select>
          <input
            type="number"
            placeholder="Threshold"
            min={1}
            value={newBonus.threshold}
            onChange={(e) => setNewBonus((s) => ({ ...s, threshold: e.target.value }))}
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
          <input
            type="number"
            placeholder="Bonus (₦)"
            min={1}
            step={0.01}
            value={newBonus.bonusAmountNaira}
            onChange={(e) =>
              setNewBonus((s) => ({ ...s, bonusAmountNaira: e.target.value }))
            }
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
          <button
            type="submit"
            disabled={creatingBonus}
            className="md:col-span-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {creatingBonus ? "Adding…" : "Add bonus"}
          </button>
          {bonusError && (
            <p className="md:col-span-5 text-red-400 text-sm">{bonusError}</p>
          )}
        </form>

        {bonusesLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : bonuses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No bonuses configured for this campaign yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Creator</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Threshold</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Bonus (₦)</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {bonuses.map((b) => {
                  const status = b.paidAt
                    ? { label: "Paid", cls: "bg-green-900/40 text-green-300 border-green-800/40" }
                    : b.earnedAt
                    ? { label: "Earned — owed", cls: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40" }
                    : { label: "Pending", cls: "bg-gray-800/40 text-gray-300 border-gray-700/40" };
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-white">{b.creator.displayName}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {b.threshold.toLocaleString()} {b.thresholdType}
                      </td>
                      <td className="px-6 py-4 text-gray-200">
                        ₦{(b.bonusAmountKobo / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded border ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Links Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            Campaign Links ({campaign.links.length})
          </h3>
        </div>
        {campaign.links.length === 0 ? (
          <div className="p-4 md:p-8 text-center text-gray-400">No links in this campaign</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Short Code
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Destination URL
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Clicks
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Unique
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaign.links.map((link) => (
                  <tr
                    key={link.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-mono">
                      {link.shortCode}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm truncate max-w-xs">
                      {link.destinationUrl}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {link.totalClicks}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {link.uniqueClicks}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          link.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {link.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      
      {/* Webhook Settings */}
      <div className="mt-8">
        <WebhookSettings campaignId={params.id} />
      </div>
    </div>
    </div>
  );
}
