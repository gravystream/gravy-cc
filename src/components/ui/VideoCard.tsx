"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface VideoCardProps {
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  aiScore?: number | null;
  aspectRatio?: "16/9" | "9/16" | "1/1";
  onClick?: () => void;
  className?: string;
  overlay?: React.ReactNode;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoCard({
  thumbnailUrl,
  durationSeconds,
  aiScore,
  aspectRatio = "16/9",
  onClick,
  className,
  overlay,
}: VideoCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#1E1E1E] group cursor-pointer",
        `aspect-[${aspectRatio.replace("/", "/")}]`,
        className
      )}
      style={{ aspectRatio: aspectRatio.replace("/", "/") }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
          <svg className="w-12 h-12 text-[#444444]" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 8l8 4-8 4V8z" fill="currentColor"/>
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
      {durationSeconds != null && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
          {formatDuration(durationSeconds)}
        </div>
      )}

      {/* AI Score badge */}
      {aiScore != null && (
        <div
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm"
          style={{
            backgroundColor: aiScore >= 60 ? "rgba(5,46,22,0.9)" : "rgba(28,5,5,0.9)",
            color: aiScore >= 60 ? "#22C55E" : "#EF4444",
          }}
        >
          AI {aiScore}
        </div>
      )}

      {overlay}
    </div>
  );
}
