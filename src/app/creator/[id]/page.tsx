"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Play,
  Briefcase,
  TrendingUp,
  Globe,
  ExternalLink,
  ArrowLeft,
  Shield,
  Zap,
  Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PortfolioVideo = {
  id: string;
  title: string;
  description?: string | null;
  cloudinaryUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  views: number;
  isFeatured: boolean;
};

type JobReview = {
  overallRating: number;
  qualityRating?: number | null;
  communicationRating?: number | null;
  comment?: string | null;
  createdAt: string;
};

type Job = {
  id: string;
  createdAt: string;
  review?: JobReview | null;
  campaign?: {
    title: string;
    brand?: { companyName: string } | null;
  } | null;
};

type Creator = {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  tagline?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  languages: string[];
  niches: string[];
  platforms: string[];
  baseRateKobo: number;
  currency: string;
  availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  isVerified: boolean;
  totalJobsCompleted: number;
  avgRating: number;
  totalReviews: number;
  responseTimeHours: number;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  createdAt: string;
  portfolioVideos: PortfolioVideo[];
  jobs: Job[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function koboToNaira(kobo: number): string {
  if (kobo === 0) return "Contact";
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`;
  return `₦${naira.toLocaleString()}`;
}

function formatResponseTime(hours: number): string {
  if (hours < 1) return "< 1 hour";
  if (hours === 1) return "~1 hour";
  if (hours < 24) return `~${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "~1 day" : `~${days} days`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(rating)
              ? "text-[#D4A843] fill-[#D4A843]"
              : "text-[#444]"
          }
        />
      ))}
    </span>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <div className="h-48 bg-[#141414] animate-pulse" />
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex gap-6 -mt-16 mb-8">
          <div className="w-32 h-32 rounded-full bg-[#222] animate-pulse border-4 border-[#0A0A0A]" />
          <div className="mt-20 flex-1 space-y-3">
            <div className="h-8 w-64 bg-[#222] rounded animate-pulse" />
            <div className="h-4 w-48 bg-[#1a1a1a] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#141414] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#141414] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"portfolio" | "reviews">(
    "portfolio"
  );

  useEffect(() => {
    if (!id) return;
    fetch(`/api/creators/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Creator not found");
        return r.json();
      })
      .then((data) => {
        setCreator(data.creator);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <ProfileSkeleton />;

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="text-6xl mb-6">🎬</div>
          <h1 className="text-3xl font-bold text-white font-quicksand mb-3">
            Creator not found
          </h1>
          <p className="text-[#808080] mb-8 max-w-sm">
            This profile doesn&apos;t exist or may have been removed.
          </p>
          <Link href="/how-it-works">
            <Button variant="primary">Browse Creators</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const availabilityColor =
    creator.availability === "AVAILABLE"
      ? "text-[#22C55E]"
      : creator.availability === "BUSY"
      ? "text-[#F59E0B]"
      : "text-[#EF4444]";
  const availabilityDot =
    creator.availability === "AVAILABLE"
      ? "bg-[#22C55E]"
      : creator.availability === "BUSY"
      ? "bg-[#F59E0B]"
      : "bg-[#EF4444]";
  const availabilityLabel =
    creator.availability === "AVAILABLE"
      ? "Available"
      : creator.availability === "BUSY"
      ? "Busy"
      : "Unavailable";

  const reviewsWithComment = creator.jobs
    .filter((j) => j.review?.comment)
    .map((j) => j.review!);

  const initials = creator.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* ── Cover ──────────────────────────────────────────────────── */}
      <div
        className="h-48 md:h-64 w-full relative overflow-hidden"
        style={{
          background: creator.coverUrl
            ? `url(${creator.coverUrl}) center/cover`
            : "linear-gradient(135deg, #1a1208 0%, #2d1f00 40%, #0f0d0a 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]/80" />
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 -mt-16 mb-8 relative z-10">
          {/* Left: identity */}
          <div className="flex-1">
            <div className="flex items-end gap-5 mb-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#0A0A0A] shadow-xl"
                  />
                ) : (
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-[#0A0A0A] bg-[#D4A843]/20 flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-bold text-[#D4A843] font-quicksand">
                      {initials}
                    </span>
                  </div>
                )}
                {/* Verified badge */}
                {creator.isVerified && (
                  <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#D4A843] rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white font-quicksand">
                    {creator.displayName}
                  </h1>
                  {creator.isVerified && (
                    <span className="text-xs bg-[#D4A843]/15 text-[#D4A843] px-2 py-0.5 rounded-full border border-[#D4A843]/30 font-medium">
                      Verified ✓
                    </span>
                  )}
                </div>
                <p className="text-[#808080] text-sm mb-2">
                  @{creator.username}
                </p>
                {creator.tagline && (
                  <p className="text-[#C7C7C7] text-base italic">
                    &ldquo;{creator.tagline}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Location + availability */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {creator.location && (
                <span className="flex items-center gap-1.5 text-sm text-[#808080]">
                  <MapPin className="w-3.5 h-3.5" />
                  {creator.location}
                </span>
              )}
              <span className={`flex items-center gap-1.5 text-sm font-medium ${availabilityColor}`}>
                <span className={`w-2 h-2 rounded-full ${availabilityDot} animate-pulse`} />
                {availabilityLabel}
              </span>
              {creator.avgRating > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-[#C7C7C7]">
                  <StarRow rating={creator.avgRating} />
                  <span className="font-medium text-white">{creator.avgRating.toFixed(1)}</span>
                  <span className="text-[#555]">({creator.totalReviews})</span>
                </span>
              )}
            </div>

            {/* Niches */}
            {creator.niches.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {creator.niches.map((n) => (
                  <span
                    key={n}
                    className="px-3 py-1 text-xs bg-[#1E1E1E] border border-[#2A2A2A] text-[#C7C7C7] rounded-full"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}

            {/* Platforms */}
            {creator.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {creator.platforms.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 text-xs bg-[#D4A843]/10 border border-[#D4A843]/25 text-[#D4A843] rounded-full font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {/* Social links */}
            {(creator.tiktokUrl ||
              creator.instagramUrl ||
              creator.youtubeUrl ||
              creator.twitterUrl) && (
              <div className="flex gap-3">
                {creator.tiktokUrl && (
                  <a
                    href={creator.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1.5 text-[#808080] hover:text-[#D4A843] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> TikTok
                  </a>
                )}
                {creator.instagramUrl && (
                  <a
                    href={creator.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1.5 text-[#808080] hover:text-[#D4A843] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Instagram
                  </a>
                )}
                {creator.youtubeUrl && (
                  <a
                    href={creator.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1.5 text-[#808080] hover:text-[#D4A843] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> YouTube
                  </a>
                )}
                {creator.twitterUrl && (
                  <a
                    href={creator.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1.5 text-[#808080] hover:text-[#D4A843] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Twitter / X
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: Hire card */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="card border border-[#2A2A2A] p-6 rounded-2xl sticky top-6">
              {/* Rate */}
              <div className="mb-5 text-center">
                <div className="text-3xl font-bold text-white font-quicksand mb-1">
                  {koboToNaira(creator.baseRateKobo)}
                </div>
                <div className="text-sm text-[#808080]">per video</div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-5 text-center">
                <div className="bg-[#141414] rounded-xl p-3">
                  <div className="text-lg font-bold text-white">
                    {creator.totalJobsCompleted}
                  </div>
                  <div className="text-xs text-[#555]">Jobs Done</div>
                </div>
                <div className="bg-[#141414] rounded-xl p-3">
                  <div className="text-lg font-bold text-white">
                    {creator.avgRating > 0
                      ? creator.avgRating.toFixed(1)
                      : "New"}
                  </div>
                  <div className="text-xs text-[#555]">Avg Rating</div>
                </div>
              </div>

              {/* Response time */}
              <div className="flex items-center gap-2 mb-5 text-sm text-[#808080]">
                <Clock className="w-4 h-4 text-[#D4A843]" />
                Responds in{" "}
                <span className="text-white font-medium">
                  {formatResponseTime(creator.responseTimeHours)}
                </span>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <Link href={`/dashboard/brand/campaigns/new?creatorId=${creator.id}`} className="block">
                  <Button variant="gold" size="lg" className="w-full">
                    Direct Hire →
                  </Button>
                </Link>
                <Link href="/dashboard/brand/campaigns/new" className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Post a Campaign Brief
                  </Button>
                </Link>
              </div>

              {/* Escrow note */}
              <div className="mt-4 flex items-start gap-2 text-xs text-[#555]">
                <Shield className="w-3.5 h-3.5 text-[#22C55E] mt-0.5 flex-shrink-0" />
                <span>
                  All payments held in escrow. Released on your approval only.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            {
              icon: <Briefcase className="w-5 h-5 text-[#D4A843]" />,
              value: creator.totalJobsCompleted.toString(),
              label: "Campaigns Completed",
            },
            {
              icon: <Star className="w-5 h-5 text-[#D4A843]" />,
              value:
                creator.avgRating > 0
                  ? `${creator.avgRating.toFixed(1)} ★`
                  : "New",
              label: `${creator.totalReviews} Reviews`,
            },
            {
              icon: <Clock className="w-5 h-5 text-[#D4A843]" />,
              value: formatResponseTime(creator.responseTimeHours),
              label: "Avg Response Time",
            },
            {
              icon: <Globe className="w-5 h-5 text-[#D4A843]" />,
              value:
                creator.languages.length > 0
                  ? creator.languages.slice(0, 2).join(", ")
                  : "Unlisted",
              label: "Languages",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-3"
            >
              <div className="flex-shrink-0">{s.icon}</div>
              <div>
                <div className="text-base font-bold text-white font-quicksand leading-tight">
                  {s.value}
                </div>
                <div className="text-xs text-[#555]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* About */}
            {creator.bio && (
              <section>
                <h2 className="text-lg font-bold text-white font-quicksand mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#D4A843] rounded-full inline-block" />
                  About
                </h2>
                <p className="text-[#C7C7C7] leading-relaxed text-sm whitespace-pre-line">
                  {creator.bio}
                </p>
              </section>
            )}

            {/* Portfolio / Reviews tabs */}
            <section>
              <div className="flex gap-1 mb-6 bg-[#111] border border-[#1E1E1E] rounded-xl p-1 w-fit">
                <button
                  onClick={() => setActiveTab("portfolio")}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "portfolio"
                      ? "bg-[#D4A843] text-black"
                      : "text-[#808080] hover:text-white"
                  }`}
                >
                  Portfolio ({creator.portfolioVideos.length})
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "reviews"
                      ? "bg-[#D4A843] text-black"
                      : "text-[#808080] hover:text-white"
                  }`}
                >
                  Reviews ({reviewsWithComment.length})
                </button>
              </div>

              {/* Portfolio grid */}
              {activeTab === "portfolio" && (
                <>
                  {creator.portfolioVideos.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-[#2A2A2A] rounded-xl">
                      <Play className="w-10 h-10 text-[#333] mx-auto mb-3" />
                      <p className="text-[#555] text-sm">
                        No portfolio videos yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {creator.portfolioVideos.map((v) => (
                        <a
                          key={v.id}
                          href={v.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative bg-[#111] rounded-xl overflow-hidden border border-[#1E1E1E] hover:border-[#D4A843]/40 transition-all"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-video relative overflow-hidden bg-[#0d0d0d]">
                            {v.thumbnailUrl ? (
                              <img
                                src={v.thumbnailUrl}
                                alt={v.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#1a1208] to-[#0f0d0a] flex items-center justify-center">
                                <Play className="w-8 h-8 text-[#333]" />
                              </div>
                            )}
                            {/* Play overlay */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#D4A843] flex items-center justify-center">
                                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                              </div>
                            </div>
                            {/* Featured badge */}
                            {v.isFeatured && (
                              <div className="absolute top-2 left-2">
                                <span className="text-xs bg-[#D4A843] text-black px-2 py-0.5 rounded-full font-bold">
                                  Featured
                                </span>
                              </div>
                            )}
                            {/* Duration */}
                            {v.durationSeconds != null && (
                              <div className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                                {formatDuration(v.durationSeconds)}
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-3">
                            <p className="text-sm font-medium text-white truncate mb-1">
                              {v.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[#555]">
                              <Eye className="w-3 h-3" />
                              {v.views.toLocaleString()} views
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Reviews */}
              {activeTab === "reviews" && (
                <>
                  {reviewsWithComment.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-[#2A2A2A] rounded-xl">
                      <Star className="w-10 h-10 text-[#333] mx-auto mb-3" />
                      <p className="text-[#555] text-sm">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviewsWithComment.map((r, i) => {
                        const job = creator.jobs.filter(
                          (j) => j.review?.comment
                        )[i];
                        return (
                          <div
                            key={i}
                            className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-sm font-semibold text-white mb-0.5">
                                  {job?.campaign?.brand?.companyName ??
                                    "A Brand"}
                                </p>
                                {job?.campaign?.title && (
                                  <p className="text-xs text-[#555]">
                                    {job.campaign.title}
                                  </p>
                                )}
                              </div>
                              <StarRow rating={r.overallRating} />
                            </div>
                            {r.comment && (
                              <p className="text-sm text-[#C7C7C7] leading-relaxed italic">
                                &ldquo;{r.comment}&rdquo;
                              </p>
                            )}
                            {/* Sub-ratings */}
                            {(r.qualityRating ||
                              r.communicationRating) && (
                              <div className="flex gap-4 mt-3 text-xs text-[#555]">
                                {r.qualityRating != null && (
                                  <span>
                                    Quality:{" "}
                                    <span className="text-[#D4A843]">
                                      {r.qualityRating}/5
                                    </span>
                                  </span>
                                )}
                                {r.communicationRating != null && (
                                  <span>
                                    Communication:{" "}
                                    <span className="text-[#D4A843]">
                                      {r.communicationRating}/5
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-[#444] mt-3">
                              {new Date(r.createdAt).toLocaleDateString(
                                "en-NG",
                                { month: "short", year: "numeric" }
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Sidebar: additional info (desktop supplemental) */}
          <div className="hidden lg:block space-y-6">
            {/* AI Score teaser */}
            {creator.totalJobsCompleted > 0 && (
              <div className="card border border-[#1E1E1E] p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[#D4A843]" />
                  <span className="text-sm font-semibold text-white">
                    AI Quality Score
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#555]">
                    Based on all submissions
                  </span>
                  <span className="text-sm font-bold text-[#22C55E]">
                    Qualified ✓
                  </span>
                </div>
                <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#22C55E] to-[#D4A843] rounded-full"
                    style={{
                      width: `${Math.min(
                        95,
                        60 + creator.avgRating * 7
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-[#555] mt-2">
                  All proposals are AI-scored before reaching brands.
                </p>
              </div>
            )}

            {/* Languages */}
            {creator.languages.length > 0 && (
              <div className="card border border-[#1E1E1E] p-5 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#D4A843]" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {creator.languages.map((l) => (
                    <span
                      key={l}
                      className="text-xs bg-[#141414] border border-[#2A2A2A] text-[#C7C7C7] px-3 py-1 rounded-full"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member since */}
            <div className="card border border-[#1E1E1E] p-5 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4A843]" />
                Member Since
              </h3>
              <p className="text-sm text-[#C7C7C7]">
                {new Date(creator.createdAt).toLocaleDateString("en-NG", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-[#555] mt-1">
                {creator.totalJobsCompleted} completed campaigns
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────── */}
        <div className="mt-16 mb-8 border border-[#D4A843]/20 rounded-3xl p-8 md:p-12 text-center bg-[#D4A843]/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#D4A843]/3 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-quicksand mb-3">
              Ready to work with {creator.displayName}?
            </h2>
            <p className="text-[#808080] mb-8 max-w-md mx-auto text-sm">
              Send a direct brief or post an open campaign. Escrow protection
              on every deal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/dashboard/brand/campaigns/new?creatorId=${creator.id}`}>
                <Button variant="gold" size="lg">
                  Direct Hire {creator.displayName.split(" ")[0]} →
                </Button>
              </Link>
              <Link href="/auth/signup/brand">
                <Button variant="primary" size="lg">
                  Sign Up as Brand
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
