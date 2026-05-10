"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, Search, Filter, Star, Trophy, Users,
  ChevronDown, Zap, Award, ArrowUpRight,
} from "lucide-react";

interface MatchResult {
  creatorId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  niches: string[];
  platforms: string[];
  matchScore: number;
  matchReasons: string[];
  tier: string;
  overallScore: number;
  avgRating: number;
  totalJobsCompleted: number;
  baseRateKobo: number;
}

const tierColors: Record<string, string> = {
  bronze: "text-orange-400 bg-orange-900/20",
  silver: "text-gray-300 bg-gray-700/30",
  gold: "text-yellow-400 bg-yellow-900/20",
  platinum: "text-cyan-300 bg-cyan-900/20",
};

const NICHE_OPTIONS = [
  "Fashion", "Beauty", "Tech", "Gaming", "Food", "Travel",
  "Fitness", "Lifestyle", "Comedy", "Education", "Music", "Finance",
];

const PLATFORM_OPTIONS = [
  "TikTok", "Instagram", "YouTube", "Twitter/X", "Facebook", "LinkedIn",
];

function CreatorMatchCard({ match }: { match: MatchResult }) {
  const tierClass = tierColors[match.tier] || tierColors.bronze;
  const rateDisplay = match.baseRateKobo > 0
    ? `₦${(match.baseRateKobo / 100).toLocaleString()}`
    : "Negotiable";

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-violet-500/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-violet-900/30 flex items-center justify-center text-violet-400 font-bold text-lg flex-shrink-0">
          {match.displayName[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{match.displayName}</h3>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium capitalize ${tierClass}`}>
              {match.tier}
            </span>
          </div>
          <p className="text-sm text-gray-500">@{match.username}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-violet-400">{match.matchScore}</div>
          <p className="text-[10px] text-gray-500 uppercase">Match</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {match.niches.slice(0, 4).map((n) => (
          <span key={n} className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">{n}</span>
        ))}
        {match.platforms.slice(0, 3).map((p) => (
          <span key={p} className="px-2 py-0.5 bg-violet-900/20 text-violet-400 text-xs rounded-full">{p}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {match.matchReasons.map((r, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-green-400">
            <Zap className="w-3 h-3" /> {r}
          </span>
        ))}
      </div>

      <div className="grid stagger-children grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-700/30 text-center">
        <div>
          <p className="text-sm font-semibold">{match.overallScore}</p>
          <p className="text-[10px] text-gray-500">Score</p>
        </div>
        <div>
          <p className="text-sm font-semibold flex items-center justify-center gap-0.5">
            {match.avgRating > 0 ? match.avgRating.toFixed(1) : "—"}
            <Star className="w-3 h-3 text-yellow-400" />
          </p>
          <p className="text-[10px] text-gray-500">Rating</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{match.totalJobsCompleted}</p>
          <p className="text-[10px] text-gray-500">Jobs</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{rateDisplay}</p>
          <p className="text-[10px] text-gray-500">Rate</p>
        </div>
      </div>
    </div>
  );
}

export default function SmartMatchPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState("");
  const [searched, setSearched] = useState(false);

  async function runMatch() {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (selectedNiches.length > 0) params.set("niches", selectedNiches.join(","));
      if (selectedPlatforms.length > 0) params.set("platforms", selectedPlatforms.join(","));
      if (maxBudget) params.set("maxBudget", maxBudget);
      params.set("limit", "20");

      const res = await fetch(`/api/brand/smart-match?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleNiche(n: string) {
    setSelectedNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-400" /> Smart Creator Matching
        </h1>
        <p className="text-gray-400 mt-1">
          Find the best creators for your campaign using AI-powered matching
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Campaign Criteria
        </h2>

        <div>
          <label className="text-xs text-gray-500 block mb-2">Niches</label>
          <div className="flex flex-wrap gap-2">
            {NICHE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => toggleNiche(n)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedNiches.includes(n)
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedPlatforms.includes(p)
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-2">Max Budget (Kobo)</label>
          <input
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="e.g. 500000"
            className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={runMatch}
          disabled={loading}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Finding Creators..." : "Find Best Matches"}
        </button>
      </div>

      {/* Results */}
      {searched && !loading && (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            {matches.length > 0
              ? `Found ${matches.length} matching creator(s), ranked by compatibility`
              : "No creators match your criteria. Try broadening your filters."}
          </p>
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <CreatorMatchCard key={m.creatorId} match={m} />
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 md:p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Select your criteria above and click "Find Best Matches"</p>
          <p className="text-gray-500 text-sm mt-1">
            Our matching algorithm considers niche alignment, platform presence, performance scores, and more
          </p>
        </div>
      )}
    </div>
  );
}
