"use client";

import { useState, useEffect } from "react";
import {
  Trophy, Star, Zap, Shield, ArrowUpRight, RefreshCw,
  TrendingUp, Award, Target,
} from "lucide-react";

interface ScoreData {
  overallScore: number;
  engagementScore: number;
  reliabilityScore: number;
  conversionScore: number;
  qualityScore: number;
  tier: string;
  totalDataPoints: number;
  lastCalculatedAt: string;
}

const tierConfig: Record<string, { color: string; bg: string; icon: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-900/20 border-orange-800/50", icon: "B" },
  silver: { color: "text-gray-300", bg: "bg-gray-700/30 border-gray-600/50", icon: "S" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-700/50", icon: "G" },
  platinum: { color: "text-cyan-300", bg: "bg-cyan-900/20 border-cyan-700/50", icon: "P" },
};

function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "stroke-green-400" : score >= 60 ? "stroke-yellow-400" : score >= 40 ? "stroke-orange-400" : "stroke-red-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(75,85,99,0.3)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold">{score}</span>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{label}</span>
        </div>
        <span className="text-gray-400 font-medium">{score}/100</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function CreatorScorePage() {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchScore() {
    try {
      setLoading(true);
      const res = await fetch("/api/creator/score");
      if (!res.ok) throw new Error("Failed to load score");
      const data = await res.json();
      setScore(data.score);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function recalculate() {
    setRecalculating(true);
    try {
      const res = await fetch("/api/creator/score", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  }

  useEffect(() => {
    fetchScore();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-64" />
          <div className="h-64 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-red-400">{error}</div>
      </div>
    );
  }

  if (!score) return null;

  const tier = tierConfig[score.tier] || tierConfig.bronze;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Performance Score
          </h1>
          <p className="text-gray-400 mt-1">Your creator performance metrics and tier ranking</p>
        </div>
        <button
          onClick={recalculate}
          disabled={recalculating}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Calculating..." : "Recalculate"}
        </button>
      </div>

      {/* Tier Badge & Overall Score */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${tier.bg} border rounded-xl p-6 text-center col-span-1`}>
          <div className={`text-5xl font-bold ${tier.color} mb-2`}>{tier.icon}</div>
          <p className={`text-lg font-semibold ${tier.color} capitalize`}>{score.tier} Tier</p>
          <p className="text-xs text-gray-500 mt-1">Based on {score.totalDataPoints} data points</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 col-span-2">
          <div className="flex items-center gap-6">
            <div className="relative">
              <ScoreRing score={score.overallScore} label="Overall" />
            </div>
            <div className="flex-1 space-y-3">
              <ScoreBar label="Engagement" score={score.engagementScore} icon={Zap} />
              <ScoreBar label="Reliability" score={score.reliabilityScore} icon={Shield} />
              <ScoreBar label="Quality" score={score.qualityScore} icon={Star} />
              <ScoreBar label="Conversions" score={score.conversionScore} icon={Target} />
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Cards */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-gray-400">Engagement</p>
          </div>
          <p className="text-2xl font-bold">{score.engagementScore}<span className="text-sm text-gray-500">/100</span></p>
          <p className="text-xs text-gray-500 mt-1">Click-through & interaction rates</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Reliability</p>
          </div>
          <p className="text-2xl font-bold">{score.reliabilityScore}<span className="text-sm text-gray-500">/100</span></p>
          <p className="text-xs text-gray-500 mt-1">Job completion & response time</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-violet-400" />
            <p className="text-sm text-gray-400">Quality</p>
          </div>
          <p className="text-2xl font-bold">{score.qualityScore}<span className="text-sm text-gray-500">/100</span></p>
          <p className="text-xs text-gray-500 mt-1">Ratings & review sentiment</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">Conversions</p>
          </div>
          <p className="text-2xl font-bold">{score.conversionScore}<span className="text-sm text-gray-500">/100</span></p>
          <p className="text-xs text-gray-500 mt-1">Revenue generation rate</p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" /> How to improve your score
        </h3>
        <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <ArrowUpRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Complete more jobs to boost your reliability score</span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowUpRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Respond to proposals within 2 hours for maximum points</span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowUpRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Optimize your tracking links to improve conversion rates</span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowUpRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Ask brands for reviews after successful campaigns</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Last calculated: {new Date(score.lastCalculatedAt).toLocaleString()}
      </p>
    </div>
  );
}
