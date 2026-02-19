"use client";
import { useState, useEffect } from "react";

export default function CreatorProfilePage() {
  const [form, setForm] = useState({ bio: "", niche: "", followers: "", engagementRate: "", ratePerPost: "", portfolioUrl: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, niche: form.niche.split(",").map(n => n.trim()), followers: parseInt(form.followers), engagementRate: parseFloat(form.engagementRate), ratePerPost: parseFloat(form.ratePerPost) }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Your Profile</h1>
      <p className="text-gray-400 mb-8">Update your creator profile to attract brands</p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {saved && <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">Profile saved!</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm({...form,bio:e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
          </div>
          {[["niche","Niches (comma-separated)","text"],["followers","Followers","number"],["engagementRate","Engagement Rate (%)","number"],["ratePerPost","Rate Per Post (₦)","number"],["portfolioUrl","Portfolio URL","url"]].map(([field,label,type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={e => setForm({...form,[field]:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
