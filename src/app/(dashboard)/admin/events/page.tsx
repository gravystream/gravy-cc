"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EventRow {
  id: string;
  name: string;
  location: string;
  date: string;
  description: string | null;
  budgetKobo: number;
  signupsGenerated: number;
  costPerAcquisitionKobo: number;
  _count: { attendingCreators: number };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    date: "",
    budgetNaira: "",
    description: "",
  });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/events");
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const naira = parseFloat(form.budgetNaira);
    if (!form.name.trim() || !form.location.trim() || !form.date || isNaN(naira)) {
      setError("Name, location, date, and budget required");
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          date: form.date,
          description: form.description || undefined,
          budgetKobo: Math.round(naira * 100),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create event");
      }
      setForm({ name: "", location: "", date: "", budgetNaira: "", description: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Event Activation</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track in-person events that drive signups. Cost-per-acquisition is
          recomputed from attached creators' signup attribution.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3"
      >
        <h2 className="text-lg font-semibold text-white">New event</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Event name"
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Location"
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.budgetNaira}
            onChange={(e) => setForm({ ...form, budgetNaira: e.target.value })}
            placeholder="Budget (₦)"
            className="px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create event"}
        </button>
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No events yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Event</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Date</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Location</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Budget</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Creators</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Signups</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">CPA (₦)</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="text-white hover:text-violet-400"
                      >
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {e.location}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      ₦{(e.budgetKobo / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {e._count.attendingCreators}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {e.signupsGenerated.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-200">
                      {e.costPerAcquisitionKobo > 0
                        ? `₦${(e.costPerAcquisitionKobo / 100).toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
