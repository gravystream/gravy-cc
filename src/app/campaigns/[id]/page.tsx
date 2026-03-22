"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Users,
  Briefcase,
  CheckCircle,
  Globe,
  TrendingUp,
} from "lucide-react";

// Types
interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avgRating: number;
  totalJobsCompleted: number;
  isVerified: boolean;
}

interface Review {
  overallRating: number;
  qualityRating: number;
  communicationRating: number;
  comment: string;
}

interface Job {
  id: string;
  status: string;
  createdAt: string;
  review?: Review;
  creator: Creator;
}

interface Proposal {
  id: string;
  status: string;
  createdAt: string;
  creator: Creator;
}

interface Brand {
  id: string;
  companyName: string;
  logoUrl?: string;
  industry: string;
  website?: string;
  user: {
    name: string;
  };
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  budgetKobo: number;
  currency: string;
  niches: string[];
  platforms: string[];
  contentType?: string;
  deliverables: string[];
  timeline?: string;
  createdAt: string;
  updatedAt: string;
  brand: Brand;
  jobs: Job[];
  proposals: Proposal[];
}

// Utility: Convert kobo to Naira with formatting
function koboToNaira(kobo: number): string {
  if (kobo === 0) return "Contact for pricing";

  const naira = kobo / 100;

  if (naira >= 1_000_000) {
    return `₦${(naira / 1_000_000).toFixed(1)}M`;
  }
  if (naira >= 1_000) {
    return `₦${(naira / 1_000).toFixed(1)}K`;
  }

  return `₦${naira.toFixed(0)}`;
}

// Star rating component
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={
            star <= Math.round(rating)
              ? "fill-[#D4A843] text-[#D4A843]"
              : "text-[#555]"
          }
        />
      ))}
    </div>
  );
}

// Loading skeleton
function CampaignSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-6 w-48 bg-gradient-to-r from-[#D4A843] to-transparent rounded animate-pulse"></div>

        <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-8 space-y-4">
          <div className="h-10 w-96 bg-gradient-to-r from-[#D4A843] to-transparent rounded animate-pulse"></div>
          <div className="h-6 w-full bg-gradient-to-r from-[#555] to-transparent rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="h-48 bg-gradient-to-r from-[#D4A843] to-transparent rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-gradient-to-r from-[#D4A843] to-transparent rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status badge styling
function getStatusColor(status: Campaign["status"]): string {
  switch (status) {
    case "OPEN":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "IN_PROGRESS":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "COMPLETED":
      return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    case "DRAFT":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "CANCELLED":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    default:
      return "bg-[#1E1E1E] text-[#C7C7C7]";
  }
}

// Brand initials fallback
function getBrandInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        setLoading(true);
        const res = await fetch(`/api/campaigns/${campaignId}`);

        if (!res.ok) {
          throw new Error("Campaign not found");
        }

        const data = await res.json();
        setCampaign(data.campaign);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaign");
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [campaignId]);

  if (loading) return <CampaignSkeleton />;

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Campaign not found</h1>
          <p className="text-[#808080] mb-6">{error || "This campaign may have been removed."}</p>
          <Link
            href="/campaigns"
            className="inline-block px-6 py-2 bg-[#D4A843] text-black rounded font-bold hover:bg-[#e5b856] transition"
          >
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const createdDate = new Date(campaign.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Back button + breadcrumb */}
      <div className="border-b border-[#1E1E1E] bg-[#0A0A0A]/50 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 text-[#D4A843] hover:text-[#e5b856] transition font-quicksand font-semibold"
          >
            <ArrowLeft size={20} />
            Campaigns / {campaign.title.slice(0, 40)}
            {campaign.title.length > 40 ? "..." : ""}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Campaign Hero */}
        <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-8 space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-4">
              {campaign.brand.logoUrl ? (
                <img
                  src={campaign.brand.logoUrl}
                  alt={campaign.brand.companyName}
                  className="w-16 h-16 rounded-lg bg-[#1E1E1E] object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#B8941F] flex items-center justify-center font-bold text-black text-sm">
                  {getBrandInitials(campaign.brand.companyName)}
                </div>
              )}
              <div>
                <p className="text-[#808080] text-sm mb-1">{campaign.brand.companyName}</p>
                <p className="text-[#D4A843] text-xs font-semibold bg-[#1E1E1E] inline-block px-2 py-1 rounded">
                  {campaign.brand.industry}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-bold font-quicksand text-white mb-3">
              {campaign.title}
            </h1>
            <p className="text-[#C7C7C7] line-clamp-2">{campaign.description.slice(0, 200)}</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-3 gap-8">
          {/* Left column (2/3) */}
          <div className="col-span-2 space-y-8">
            {/* Campaign details */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold font-quicksand text-white mb-3">About This Campaign</h2>
                <p className="text-[#C7C7C7] whitespace-pre-line leading-relaxed">
                  {campaign.description}
                </p>
              </div>

              {campaign.niches.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#D4A843] mb-3">Niches</h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.niches.map((niche) => (
                      <span
                        key={niche}
                        className="border border-[#D4A843] text-[#D4A843] text-xs px-3 py-1 rounded-full"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {campaign.platforms.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#D4A843] mb-3">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="bg-[#1E1E1E] text-[#C7C7C7] text-xs px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        <Globe size={14} />
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {campaign.contentType && (
                <div>
                  <h3 className="text-sm font-bold text-[#D4A843] mb-2">Content Type</h3>
                  <p className="text-[#C7C7C7]">{campaign.contentType}</p>
                </div>
              )}

              {campaign.deliverables.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#D4A843] mb-3">Deliverables</h3>
                  <ul className="space-y-2">
                    {campaign.deliverables.map((deliverable, idx) => (
                      <li key={idx} className="flex gap-2 text-[#C7C7C7] text-sm">
                        <CheckCircle size={16} className="text-[#D4A843] mt-0.5 flex-shrink-0" />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {campaign.timeline && (
                <div>
                  <h3 className="text-sm font-bold text-[#D4A843] mb-2">Timeline</h3>
                  <p className="text-[#C7C7C7] flex items-center gap-2">
                    <Calendar size={16} className="text-[#D4A843]" />
                    {campaign.timeline}
                  </p>
                </div>
              )}
            </div>

            {/* Creators working on this */}
            {campaign.jobs.length > 0 && (
              <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-bold font-quicksand text-white flex items-center gap-2">
                  <Users size={20} className="text-[#D4A843]" />
                  Creators Working On This
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {campaign.jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/creator/${job.creator.id}`}
                      className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-4 hover:border-[#D4A843] transition"
                    >
                      <div className="flex gap-3">
                        {job.creator.avatarUrl ? (
                          <img
                            src={job.creator.avatarUrl}
                            alt={job.creator.displayName}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#1E1E1E] flex items-center justify-center text-xs font-bold text-[#D4A843]">
                            {job.creator.displayName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">
                            {job.creator.displayName}
                            {job.creator.isVerified && (
                              <span className="text-[#D4A843] ml-1">✓</span>
                            )}
                          </p>
                          <StarRow rating={job.creator.avgRating} />
                          <p className="text-xs text-[#808080] mt-1">
                            {job.creator.totalJobsCompleted} jobs completed
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {campaign.jobs.some((job) => job.review) && (
              <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-bold font-quicksand text-white flex items-center gap-2">
               <Star size={20} className="text-[#D4A843]" />
                  Reviews from This Campaign
                </h2>
                <div className="space-y-4">
                  {campaign.jobs
                    .filter((job) => job.review)
                    .map((job) => (
                      <div
                        key={job.id}
                        className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-white">
                            {job.creator.displayName}
                          </p>
                          <StarRow rating={job.review!.overallRating} />
                        </div>
                        <p className="text-sm text-[#C7C7C7]">{job.review!.comment}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column (1/3) - sticky */}
          <div className="space-y-6">
            {/* Budget card */}
            <div className="sticky top-24 bg-[#111] border border-[#1E1E1E] rounded-lg p-6 space-y-4">
              <div>
                <p className="text-[#808080] text-sm mb-2">Total Budget</p>
                <p className="text-4xl font-bold text-[#D4A843] font-quicksand">
                  {koboToNaira(campaign.budgetKobo)}
                </p>
              </div>

              {campaign.timeline && (
                <div className="py-3 border-t border-[#1E1E1E]">
                  <p className="text-[#808080] text-xs mb-2">Timeline</p>
                  <p className="text-[#C7C7C7] text-sm">{campaign.timeline}</p>
                </div>
              )}

              <button className="w-full bg-[#D4A843] text-black font-bold py-3 rounded-lg hover:bg-[#e5b856] transition">
                Apply for this Campaign
              </button>

              <Link
                href="/auth/signup/brand"
                className="w-full border-2 border-[#D4A843] text-[#D4A843] font-bold py-2 rounded-lg hover:bg-[#D4A843]/10 transition text-center block"
              >
                Post a Similar Campaign
              </Link>

              <div className="py-3 border-t border-[#1E1E1E] text-xs text-[#808080]">
                <p>💰 Escrow protected. Payment held safely until delivery.</p>
              </div>
            </div>

            {/* Brand card */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-[#D4A843]" />
                About the Brand
              </h3>
              <div className="flex gap-3">
                {campaign.brand.logoUrl ? (
                  <img
                    src={campaign.brand.logoUrl}
                    alt={campaign.brand.companyName}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#B8941F] flex items-center justify-center font-bold text-black">
                    {getBrandInitials(campaign.brand.companyName)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{campaign.brand.companyName}</p>
                  <p className="text-xs text-[#808080]">{campaign.brand.industry}</p>
                </div>
              </div>
              <Link
                href={`/brand/${campaign.brand.id}`}
                className="text-[#D4A843] text-xs hover:underline"
              >
                Browse brand's campaigns
              </Link>
            </div>

            {/* Stats */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#808080]">Creators Hired</span>
                <span className="font-bold text-white">{campaign.jobs.length}</span>
              </div>
              <div className="flex justify-between border-t border-[#1E1E1E] pt-3">
                <span className="text-[#808080]">Applications</span>
                <span className="font-bold text-white">{campaign.proposals.length}</span>
              </div>
              <div className="flex justify-between border-t border-[#1E1E1E] pt-3">
                <span className="text-[#808080]">Posted</span>
                <span className="font-bold text-white">{createdDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA banner */}
        <div className="border-2 border-[#D4A843] rounded-lg p-8 text-center space-y-4 bg-[#111]">
          <h2 className="text-2xl font-bold font-quicksand text-white">
            Ready to land your next brand deal?
          </h2>
          <p className="text-[#C7C7C7]">
            Browse open campaigns or sign up as a creator to start earning today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/campaigns"
              className="px-6 py-3 bg-[#D4A843] text-black font-bold rounded-lg hover:bg-[#e5b856] transition"
            >
              Browse Campaigns
            </Link>
            <Link
              href="/auth/signup/creator"
              className="px-6 py-3 border-2 border-[#D4A843] text-[#D4A843] font-bold rounded-lg hover:bg-[#D4A843]/10 transition"
            >
              Sign Up as Creator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
