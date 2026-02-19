"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaignPage() {
  const [form, setForm] = useState({ title: "", description: "", budget: "", deadline: "", niche: "", platforms: "", requirements: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget: parseFloat(form.budget),
        deadline: new Date(form.deadline).toISOString(),
        niche: form.niche.split(",").map(n => n.trim()),
        platforms: form.platforms.split(",").map(p => p.trim()),
      }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setLoading(false); }
    else router.push("/brand");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Create Campaign</h1>
      <p className="text-gray-400 mb-8">Set up a new influencer campaign</p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
          {[["title","Campaign Title","text"],["budget","Budget (₦)","number"],["deadline","Deadline","date"],["niche","Niches (comma-separated)","text"],["platforms","Platforms (comma-separated)","text"]].map(([field,label,type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={e => setForm({...form,[field]:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea rows={4} value={form.description} onChange={e => setForm({...form,description:e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm({...form,requirements:e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}
