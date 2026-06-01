"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OwedBonus {
  id: string;
  threshold: number;
  thresholdType: string;
  bonusAmountKobo: number;
  earnedAt: string;
  notes: string | null;
  campaign: { id: string; title: string };
  creator: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    tier: string;
    isGravyArmy: boolean;
  };
}

const TIER_BADGE: Record<string, string> = {
  BRONZE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  SILVER: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  GOLD: "bg-yellow-900/40 text-yellow-300 border-yellow-600/40",
  PLATINUM: "bg-purple-900/40 text-purple-200 border-purple-500/40",
};

export default function BrandBonusesPage() {
  const [bonuses, setBonuses] = useState<OwedBonus[]>([]);
  const [totals, setTotals] = useState({ count: 0, totalOwedKobo: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/brand/bonuses-owed");
      if (!res.ok) throw new Error("Failed to load bonuses");
      const data = await res.json();
      setBonuses(data.bonuses ?? []);
      setTotals(data.totals ?? { count: 0, totalOwedKobo: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (bonusId: string) => {
    if (!confirm("Mark this bonus as paid? This action can't be undone.")) {
      return;
    }
    try {
      setPendingId(bonusId);
      const res = await fetch("/api/brand/bonuses-owed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to mark paid");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark paid");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bonuses owed</h1>
        <p className="text-sm text-gray-400 mt-1">
          Performance bonuses your creators have earned. Mark paid once you've
          disbursed manually.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Owed bonuses</p>
          <p className="text-3xl font-bold text-white mt-2">{totals.count}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Total owed (₦)</p>
          <p className="text-3xl font-bold text-white mt-2">
            ₦{(totals.totalOwedKobo / 100).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : bonuses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No bonuses to pay right now
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
                    Campaign
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Threshold
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Earned
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Amount (₦)
                  </th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {bonuses.map((b) => {
                  const tierClass =
                    TIER_BADGE[b.creator.tier] ?? TIER_BADGE.BRONZE;
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {b.creator.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.creator.avatarUrl}
                              alt={b.creator.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm">
                                {b.creator.displayName}
                              </span>
                              {b.creator.isGravyArmy && (
                                <span className="text-xs bg-purple-900/40 text-purple-200 border border-purple-500/40 px-1.5 rounded">
                                  GRAVY
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded border w-fit ${tierClass}`}
                            >
                              {b.creator.tier}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/brand/campaigns/${b.campaign.id}`}
                          className="text-blue-400 hover:underline text-sm"
                        >
                          {b.campaign.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {b.threshold.toLocaleString()} {b.thresholdType}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(b.earnedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        ₦{(b.bonusAmountKobo / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => markPaid(b.id)}
                          disabled={pendingId === b.id}
                          className="px-3 py-1.5 text-sm rounded-lg bg-green-900/40 hover:bg-green-900/60 text-green-300 border border-green-800/50 disabled:opacity-50"
                        >
                          {pendingId === b.id ? "Marking…" : "Mark paid"}
                        </button>
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
