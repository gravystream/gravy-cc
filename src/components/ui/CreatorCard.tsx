"use client";
import React from "react";
import { cn, formatCompactCurrency } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Star, MapPin } from "lucide-react";

export interface CreatorCardData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  tagline?: string | null;
  niches: string[];
  location?: string | null;
  platforms: string[];
  baseRateKobo: number;
  avgRating: number;
  totalReviews: number;
  totalJobsCompleted: number;
  availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  isVerified?: boolean;
  featuredVideoThumbnail?: string | null;
}

interface CreatorCardProps {
  creator: CreatorCardData;
  onView?: (id: string) => void;
  onHire?: (id: string) => void;
  variant?: "grid" | "list";
  className?: string;
}

export function CreatorCard({ creator, onView, onHire, variant = "grid", className }: CreatorCardProps) {
  if (variant === "list") {
    return (
      <div className={cn("card-hover p-4 flex items-center gap-4", className)}>
        <Avatar name={creator.displayName} src={creator.avatarUrl} size="lg" verified={creator.isVerified}
          online={creator.availability === "AVAILABLE"} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-white truncate">{creator.displayName}</span>
            {creator.availability === "AVAILABLE" && (
              <Badge variant="live" dot>Available</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#808080]">
            {creator.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{creator.location}</span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#D4A843] text-[#D4A843]" />
              {creator.avgRating.toFixed(1)} ({creator.totalReviews})
            </span>
            <span>{creator.niches.slice(0, 2).join(" · ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-white">
              from {formatCompactCurrency(creator.baseRateKobo)}
            </div>
            <div className="text-xs text-[#808080]">{creator.totalJobsCompleted} jobs</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onView?.(creator.id)}>View</Button>
          <Button size="sm" variant="gold" onClick={() => onHire?.(creator.id)}>Hire →</Button>
        </div>
      </div>
    );
  }

  // Grid variant (TikTok-style)
  return (
    <div className={cn("card-hover group overflow-hidden", className)}>
      {/* Video thumbnail area */}
      <div className="relative aspect-[4/3] bg-[#1E1E1E] overflow-hidden">
        {creator.featuredVideoThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.featuredVideoThumbnail}
            alt={`${creator.displayName}'s work`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[#2D2D2D] text-4xl font-bold font-quicksand">
              {creator.displayName[0]}
            </div>
          </div>
        )}
        {/* Availability badge */}
        <div className="absolute top-3 left-3">
          {creator.availability === "AVAILABLE" && (
            <Badge variant="live" dot>Open</Badge>
          )}
          {creator.availability === "BUSY" && (
            <Badge variant="progress" dot>Busy</Badge>
          )}
        </div>
        {/* Platforms */}
        <div className="absolute top-3 right-3 flex gap-1">
          {creator.platforms.slice(0, 2).map(p => (
            <span key={p} className="px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] text-white font-medium">
              {p}
            </span>
          ))}
        </div>
        {/* Hover hire button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <Button size="sm" variant="gold" className="w-full" onClick={() => onHire?.(creator.id)}>
            Direct Hire →
          </Button>
        </div>
      </div>

      {/* Info area */}
      <div className="p-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={creator.displayName} src={creator.avatarUrl} size="md"
            verified={creator.isVerified} online={creator.availability === "AVAILABLE"} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-white truncate">{creator.displayName}</div>
            <div className="text-xs text-[#808080] truncate">
              {creator.niches.slice(0, 2).join(" · ")}
              {creator.location && ` · ${creator.location}`}
            </div>
          </div>
        </div>

        {/* Rating + stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-[#D4A843] text-[#D4A843]" />
            <span className="text-sm font-semibold text-white">{creator.avgRating.toFixed(1)}</span>
            <span className="text-xs text-[#808080]">({creator.totalReviews})</span>
          </div>
          <span className="text-xs text-[#808080]">{creator.totalJobsCompleted} completed</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#808080]">from</div>
            <div className="text-base font-bold text-white">
              {formatCompactCurrency(creator.baseRateKobo)}
            </div>
          </div>
          <Button size="xs" variant="outline" onClick={() => onView?.(creator.id)}>
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
