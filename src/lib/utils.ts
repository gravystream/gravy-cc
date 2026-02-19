import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(kobo: number, currency = "NGN"): string {
  const amount = kobo / 100;
  if (currency === "NGN") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(kobo: number): string {
  const amount = kobo / 100;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function aiScoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#D4A843";
  return "#EF4444";
}

export function aiScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Qualified";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const NICHE_OPTIONS = [
  "Comedy", "Lifestyle", "Tech", "Fashion", "Beauty",
  "Food", "Finance", "Sports", "Education", "Travel",
  "Health", "Music", "Gaming", "Business", "Parenting",
  "Fitness", "Automotive", "Real Estate", "Fintech", "Entertainment",
];

export const PLATFORM_OPTIONS = [
  "TikTok", "Instagram", "YouTube", "Twitter/X", "Facebook",
  "Snapchat", "LinkedIn", "Pinterest",
];

export const LANGUAGE_OPTIONS = [
  "English", "Yoruba", "Igbo", "Hausa", "Pidgin",
  "French", "Portuguese", "Spanish",
];

export const LOCATION_OPTIONS = [
  "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano",
  "Enugu", "Kaduna", "Benin City", "Warri", "Owerri",
  "Uyo", "Calabar", "Abeokuta", "Onitsha",
];

export const AI_SCORE_THRESHOLD = 60; // scores >= this are "Qualified"
