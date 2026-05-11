"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  budgetKobo: number;
  deadline: string | null;
  niche: string[];
  platforms: string[];
  status: string;
};

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [niches, setNiches] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/brand/campaigns/${id}`, { cache: "no-store" });
        if (!r.ok) {
          const err = await r.json().catch(() => ({} as { error?: string }));
          setError(err.error || `Failed to load campaign (HTTP ${r.status})`);
          setLoading(false);
          return;
        }
        const { campaign } = (await r.json()) as { campaign: Campaign };
        setTitle(campaign.title || "");
        setBudget(String(Math.round((campaign.budgetKobo || 0) / 100)));
        setDeadline(campaign.deadline ? new Date(campaign.deadline).toISOString().slice(0, 10) : "");
        setNiches((campaign.niche || []).join(", "));
        setPlatforms((campaign.platforms || []).join(", "));
        setDescription(campaign.description || "");
        setRequirements(campaign.requirements || "");
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        budget: budget ? parseFloat(budget) : undefined,
        deadline: deadline || undefined,
        niches: niches.split(",").map((s) => s.trim()).filter(Boolean),
        platforms: platforms.split(",").map((s) => s.trim()).filter(Boolean),
        description,
        requirements,
      };
      const r = await fetch(`/api/brand/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({} as { error?: string }));
        setError(err.error || `Save failed (HTTP ${r.status})`);
        setSaving(false);
        return;
      }
      router.push(`/brand/campaigns/${id}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Loading campaign…</div>;
  }
  if (error && !title) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3">{error}</div>
        <Link href="/brand" className="text-violet-400 hover:underline mt-4 inline-block">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Campaign</h1>
          <p className="text-gray-400 text-sm mt-1">Update campaign details. Status is managed via Publish/Pause on the campaign page.</p>
        </div>
        <Link href={`/brand/campaigns/${id}`} className="text-sm text-gray-400 hover:text-white">← Back</Link>
      </div>

      <form onSubmit={onSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Campaign Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Budget (₦)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min={0}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Niches (comma-separated)</label>
          <input
            type="text"
            value={niches}
            onChange={(e) => setNiches(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Platforms (comma-separated)</label>
          <input
            type="text"
            value={platforms}
            onChange={(e) => setPlatforms(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Requirements</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={6}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link
            href={`/brand/campaigns/${id}`}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
