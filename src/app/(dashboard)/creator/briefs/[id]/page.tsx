"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  description: string;
  requirements: string;
  budgetKobo: number;
  deadline: string;
  niche: string[];
  platforms: string[];
  brand: { user: { name: string }; industry?: string };
  proposals: { id: string }[];
}

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [pitch, setPitch] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => { setCampaign(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pitch.trim()) { setError("Please write a pitch."); return; }
    if (!rate || isNaN(Number(rate))) { setError("Please enter a valid rate."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch: pitch.trim(), rate: Number(rate) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit proposal."); return; }
      setSubmitted(true);
      setTimeout(() => router.push("/creator/proposals"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
    </div>
  );

  if (!campaign) return (
    <div className="p-8 text-center text-gray-400">Campaign not found.</div>
  );

  const budgetNGN = (campaign.budgetKobo / 100).toLocaleString();
  const deadline = campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : "TBD";

  if (submitted) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-5xl">✅</div>
      <h2 className="text-white text-2xl font-semibold">Proposal Submitted!</h2>
      <p className="text-gray-400">Redirecting to your proposals...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link href="/creator/briefs" className="text-violet-400 hover:text-violet-300 text-sm">← Back to Briefs</Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{campaign.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{campaign.brand.user.name}{campaign.brand.industry ? ` · ${campaign.brand.industry}` : ""}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-bold text-xl">₦{budgetNGN}</p>
            <p className="text-gray-400 text-xs mt-1">{campaign.proposals.length} proposals</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {campaign.niche.map((n) => (
            <span key={n} className="bg-violet-900/30 text-violet-400 px-2 py-1 rounded-md text-xs">{n}</span>
          ))}
          {campaign.platforms?.map((p) => (
            <span key={p} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-md text-xs">{p}</span>
          ))}
        </div>

        <div>
          <p className="text-gray-300 text-sm leading-relaxed">{campaign.description}</p>
        </div>

        {campaign.requirements && (
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-white font-semibold mb-2">Requirements</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{campaign.requirements}</p>
          </div>
        )}

        <div className="border-t border-gray-800 pt-4 flex items-center gap-6 text-sm">
          <div><span className="text-gray-500">Deadline:</span> <span className="text-white">{deadline}</span></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-white text-lg font-semibold">Submit Your Proposal</h2>

        {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Your Pitch <span className="text-red-400">*</span></label>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={5}
              placeholder="Tell the brand why you're the perfect creator for this campaign..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Your Rate (₦) <span className="text-red-400">*</span></label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 150000"
              min="1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <p className="text-gray-500 text-xs mt-1">Campaign budget: ₦{budgetNGN}</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Proposal →"}
          </button>
        </form>
      </div>
    </div>
  );
}
