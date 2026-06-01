"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AttendingCreator {
  id: string;
  signupsGenerated: number;
  payoutKobo: number;
  creator: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    tier: string;
    isGravyArmy: boolean;
  };
}

interface EventDetail {
  id: string;
  name: string;
  location: string;
  date: string;
  description: string | null;
  budgetKobo: number;
  signupsGenerated: number;
  costPerAcquisitionKobo: number;
  attendingCreators: AttendingCreator[];
}

interface Candidate {
  id: string;
  username: string | null;
  displayName: string | null;
  user: { email: string };
}

const TIER_BADGE: Record<string, string> = {
  BRONZE: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  SILVER: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  GOLD: "bg-yellow-900/40 text-yellow-300 border-yellow-600/40",
  PLATINUM: "bg-purple-900/40 text-purple-200 border-purple-500/40",
};

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add creator form
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [signups, setSignups] = useState("");
  const [payoutNaira, setPayoutNaira] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [eventId]);

  useEffect(() => {
    if (!search.trim()) {
      setCandidates([]);
      return;
    }
    const t = setTimeout(() => void runSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/events/${eventId}`);
      if (!res.ok) throw new Error("Failed to load event");
      const data = await res.json();
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (q: string) => {
    const res = await fetch(
      `/api/admin/gravy-army?search=${encodeURIComponent(q)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setCandidates(data.candidates ?? []);
  };

  const addCreator = async () => {
    if (!selected) return;
    const s = parseInt(signups, 10);
    const p = parseFloat(payoutNaira);
    if (isNaN(s) || s < 0 || isNaN(p) || p < 0) {
      setError("Signups and payout must be ≥ 0");
      return;
    }
    try {
      setAdding(true);
      setError(null);
      const res = await fetch(`/api/admin/events/${eventId}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: selected.id,
          signupsGenerated: s,
          payoutKobo: Math.round(p * 100),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add");
      }
      setSelected(null);
      setSearch("");
      setSignups("");
      setPayoutNaira("");
      setCandidates([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const removeCreator = async (ecId: string) => {
    if (!confirm("Remove this creator from the event?")) return;
    try {
      setPendingId(ecId);
      const res = await fetch(
        `/api/admin/events/${eventId}/creators/${ecId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setPendingId(null);
    }
  };

  const deleteEvent = async () => {
    if (!confirm("Delete this event? This can't be undone.")) return;
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/admin/events");
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading…</div>;
  }
  if (!event) {
    return (
      <div className="text-center text-gray-400 py-12">Event not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to events
      </Link>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{event.name}</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {new Date(event.date).toLocaleDateString()} · {event.location}
            </p>
            {event.description && (
              <p className="text-gray-300 mt-3 text-sm">{event.description}</p>
            )}
          </div>
          <button
            onClick={deleteEvent}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete event
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-xl font-bold text-white">
              ₦{(event.budgetKobo / 100).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Signups generated</p>
            <p className="text-xl font-bold text-white">
              {event.signupsGenerated.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">CPA</p>
            <p className="text-xl font-bold text-white">
              {event.costPerAcquisitionKobo > 0
                ? `₦${(event.costPerAcquisitionKobo / 100).toLocaleString()}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Creators</p>
            <p className="text-xl font-bold text-white">
              {event.attendingCreators.length}
            </p>
          </div>
        </div>
      </div>

      {/* Add creator */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Add a creator</h2>
        <input
          value={selected ? (selected.displayName ?? selected.username ?? "") : search}
          onChange={(e) => {
            setSelected(null);
            setSearch(e.target.value);
          }}
          placeholder="Search Gravy Army members…"
          className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
        />
        {!selected && search.trim() && candidates.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c);
                  setCandidates([]);
                }}
                className="w-full text-left px-3 py-2 bg-gray-800/40 hover:bg-gray-800 rounded text-sm text-gray-200"
              >
                {c.displayName ?? c.username ?? c.user.email}
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              min={0}
              value={signups}
              onChange={(e) => setSignups(e.target.value)}
              placeholder="Signups generated"
              className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
            />
            <input
              type="number"
              min={0}
              step={0.01}
              value={payoutNaira}
              onChange={(e) => setPayoutNaira(e.target.value)}
              placeholder="Payout (₦)"
              className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
            />
            <button
              onClick={addCreator}
              disabled={adding}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        )}
      </div>

      {/* Attending creators */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Attending creators ({event.attendingCreators.length})
          </h2>
        </div>
        {event.attendingCreators.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No creators attached yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Creator</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Tier</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Signups</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Payout (₦)</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {event.attendingCreators.map((ec) => {
                  const tierClass =
                    TIER_BADGE[ec.creator.tier] ?? TIER_BADGE.BRONZE;
                  return (
                    <tr
                      key={ec.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ec.creator.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ec.creator.avatarUrl}
                              alt={ec.creator.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="text-white text-sm">
                              {ec.creator.displayName}
                            </p>
                            <p className="text-gray-500 text-xs">
                              @{ec.creator.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${tierClass}`}
                        >
                          {ec.creator.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold">
                        {ec.signupsGenerated.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ₦{(ec.payoutKobo / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeCreator(ec.id)}
                          disabled={pendingId === ec.id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {pendingId === ec.id ? "Removing…" : "Remove"}
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
