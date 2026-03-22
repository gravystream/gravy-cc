"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Art & Illustration",
  "Music",
  "Photography",
  "Video & Film",
  "Writing",
  "Gaming",
  "Technology",
  "Education",
  "Fitness & Wellness",
  "Fashion & Beauty",
  "Food & Cooking",
  "Other",
];

const PLATFORMS = [
  "YouTube",
  "Instagram",
  "TikTok",
  "Twitter/X",
  "Twitch",
  "Patreon",
  "Substack",
  "LinkedIn",
  "Other",
];

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleNext = () => {
    setError("");
    if (!username.trim() || !displayName.trim()) {
      setError("Username and display name are required.");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "CREATOR",
          username: username.trim(),
          displayName: displayName.trim(),
          bio: bio.trim(),
          category,
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setIsSubmitting(false);
        return;
      }

      // Trigger session refresh without useSession
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // Hard redirect to force middleware re-evaluation
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-purple-500" : "bg-gray-800"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-purple-500" : "bg-gray-800"}`} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Your Profile</h2>
              <p className="text-gray-400 text-sm mb-6">Tell us about yourself.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Display Name *</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio about yourself..." rows={3} maxLength={500} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none" />
                  <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
                </div>
              </div>

              <button onClick={handleNext} className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors">Next</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Your Content</h2>
              <p className="text-gray-400 text-sm mb-6">Help us match you with the right opportunities.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">{error}</div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500">
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedPlatforms.includes(p) ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setError(""); setStep(1); }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors">{isSubmitting ? "Setting up..." : "Complete Setup"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
