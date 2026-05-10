"use client";

import { useEffect, useState } from "react";

interface ArmyMember {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  tier: string;
  tierUpdatedAt: string | null;
  gravyOnboardedAt: string | null;
  totalJobsCompleted: number;
  totalEarningsKobo: number;
  avgRating: number | null;
  user: { email: string };
}

interface Candidate {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  tier: string;
  totalJobsCompleted: number;
  avgRating: number | null;
  user: { email: string };
}

const TIER_BADGE: Record<string, string> = {
  BRONZE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  SILVER: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  GOLD: "bg-yellow-900/40 text-yellow-300 border-yellow-600/40",
  PLATINUM: "bg-purple-900/40 text-purple-200 border-purple-500/40",
};

export default function AdminGravyArmyPage() {
  const [army, setArmy] = useState<ArmyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void loadArmy();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setCandidates([]);
      return;
    }
    const handle = setTimeout(() => void searchCandidates(search.trim()), 250);
    return () => clearTimeout(handle);
  }, [search]);

  const loadArmy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/gravy-army");
      if (!res.ok) throw new Error("Failed to load Gravy Army");
      const data = await res.json();
      setArmy(data.army ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const searchCandidates = async (q: string) => {
    try {
      setSearching(true);
      const res = await fetch(
        `/api/admin/gravy-army?search=${encodeURIComponent(q)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } finally {
      setSearching(false);
    }
  };

  const toggleMembership = async (creatorId: string, isGravyArmy: boolean) => {
    try {
      setPendingId(creatorId);
      const res = await fetch("/api/admin/gravy-army", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId, isGravyArmy }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      await loadArmy();
      if (search.trim()) await searchCandidates(search.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gravy Creator Army</h1>
        <p className="text-sm text-gray-400 mt-1">
          Flag creators as part of the Gravy Mobile launch army. Tier is recalculated weekly from rolling 30-day conversions.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add creator */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Add a creator</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or email"
          className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
        />
        {search.trim() && (
          <div className="mt-4 space-y-2">
            {searching ? (
              <p className="text-gray-400 text-sm">Searching…</p>
            ) : candidates.length === 0 ? (
              <p className="text-gray-500 text-sm">No matching creators</p>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-800/40 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatarUrl}
                        alt={c.displayName ?? ""}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">
                        {c.displayName ?? c.username ?? "Unnamed"}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {c.user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMembership(c.id, true)}
                    disabled={pendingId === c.id}
                    className="flex-shrink-0 px-3 py-1.5 text-sm rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
                  >
                    {pendingId === c.id ? "Adding…" : "Add"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Current army */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Current army ({army.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : army.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No creators in the Gravy Army yet
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
                    Tier
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Onboarded
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Jobs
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Earnings (₦)
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Rating
                  </th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {army.map((m) => {
                  const tierClass = TIER_BADGE[m.tier] ?? TIER_BADGE.BRONZE;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.avatarUrl}
                              alt={m.displayName ?? ""}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="text-white text-sm">
                              {m.displayName ?? m.username ?? "Unnamed"}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {m.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${tierClass}`}
                        >
                          {m.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {m.gravyOnboardedAt
                          ? new Date(m.gravyOnboardedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {m.totalJobsCompleted}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        ₦{(m.totalEarningsKobo / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {m.avgRating != null ? m.avgRating.toFixed(1) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleMembership(m.id, false)}
                          disabled={pendingId === m.id}
                          className="px-3 py-1.5 text-sm rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 disabled:opacity-50"
                        >
                          {pendingId === m.id ? "Removing…" : "Remove"}
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
