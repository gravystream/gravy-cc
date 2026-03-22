"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { NovacloLogo } from "@/components/NovacloLogo";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreatorItem {
  type: "creator";
  id: number;
  creator: string;
  handle: string;
  niche: string;
  location: string;
  rating: number;
  aiScore: number;
  jobs: number;
  caption: string;
  videoSrc: string;
  accent: string;
  emoji: string;
  views: string;
  likes: string;
  comments: number;
}

interface BriefItem {
  type: "brief";
  id: number;
  brand: string;
  logo: string;
  industry: string;
  niche: string;
  budget: string;
  deadline: string;
  slots: number;
  proposals: number;
  accent: string;
  emoji: string;
  title: string;
  description: string;
  requirements: string[];
}

type FeedItem = CreatorItem | BriefItem;

// ─── Constants ────────────────────────────────────────────────────────────────

const NICHES = [
  "✦ All",
  "💻 Tech",
  "💄 Beauty",
  "✈️ Travel",
  "🏠 Real Estate",
  "👗 Fashion",
  "🍔 Food",
  "💰 Finance",
];

const FEED_ITEMS: FeedItem[] = [
  {
    type: "creator",
    id: 1,
    creator: "Ada Chukwu",
    handle: "@adacreates",
    niche: "Beauty",
    location: "Lagos",
    rating: 4.9,
    aiScore: 87,
    jobs: 34,
    caption:
      "Skincare routine using only Nigerian brands 🇳🇬 — watch how I transformed my skin in 30 days",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    accent: "#C026D3",
    emoji: "💄",
    views: "284K",
    likes: "18.2K",
    comments: 342,
  },
  {
    type: "brief",
    id: 2,
    brand: "Flutterwave",
    logo: "F",
    industry: "Fintech",
    niche: "Tech",
    budget: "₦120,000",
    deadline: "5 days left",
    slots: 1,
    proposals: 14,
    accent: "#F97316",
    emoji: "💻",
    title: "Send Money Abroad — Zero Fees",
    description:
      "We need a 60-sec creator video showing how effortless it is to send money internationally with Flutterwave. Real person, real phone, real transfer. No scripts, no actors. Just you and your phone.",
    requirements: [
      "60 seconds max",
      "Show the app live",
      "Fintech or lifestyle creator preferred",
      "Must be Lagos or Abuja based",
    ],
  },
  {
    type: "creator",
    id: 3,
    creator: "Tunde Makinde",
    handle: "@tundetech",
    niche: "Tech",
    location: "Abuja",
    rating: 4.7,
    aiScore: 91,
    jobs: 61,
    caption:
      "Reviewed the new Tecno Phantom phone — the camera on this thing is actually insane 😤",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    accent: "#2563EB",
    emoji: "💻",
    views: "1.1M",
    likes: "94.5K",
    comments: 1203,
  },
  {
    type: "brief",
    id: 4,
    brand: "Zaron Cosmetics",
    logo: "Z",
    industry: "Beauty",
    niche: "Beauty",
    budget: "₦75,000",
    deadline: "3 days left",
    slots: 3,
    proposals: 23,
    accent: "#DB2777",
    emoji: "💄",
    title: "New Matte Lipstick — Get Ready With Me",
    description:
      "Authentic GRWM video featuring our new matte lipstick range. We want real people, real routines. No corporate feel — just you getting ready and looking amazing.",
    requirements: [
      "GRWM format",
      "Show product application",
      "Authentic tone only",
      "Female creator preferred",
    ],
  },
  {
    type: "creator",
    id: 5,
    creator: "Zara Kamau",
    handle: "@zaratravels",
    niche: "Travel",
    location: "Port Harcourt",
    rating: 4.8,
    aiScore: 79,
    jobs: 22,
    caption:
      "Nobody talks about how beautiful Calabar is in December 😭 this is what you've been missing",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    accent: "#0D9488",
    emoji: "✈️",
    views: "512K",
    likes: "41.8K",
    comments: 876,
  },
  {
    type: "brief",
    id: 6,
    brand: "Airbnb Nigeria",
    logo: "A",
    industry: "Travel",
    niche: "Travel",
    budget: "₦200,000",
    deadline: "7 days left",
    slots: 2,
    proposals: 8,
    accent: "#0D9488",
    emoji: "✈️",
    title: "Lagos Weekend Getaway — 3 Stays",
    description:
      "Travel creator needed to document a Lagos weekend experience across 3 different Airbnb properties. Must include local food, vibes, and honest reviews. We want people to FEEL Lagos through your lens.",
    requirements: [
      "Min 90 seconds",
      "Cover 3 Airbnb stays",
      "Include food spots",
      "Must be based in Lagos",
    ],
  },
  {
    type: "creator",
    id: 7,
    creator: "Femi Okafor",
    handle: "@femistyle",
    niche: "Fashion",
    location: "Lagos",
    rating: 4.6,
    aiScore: 83,
    jobs: 47,
    caption:
      "Styled 5 outfits under ₦15k from Yaba market — your fave designers are shaking rn 💀",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    accent: "#D4A843",
    emoji: "👗",
    views: "730K",
    likes: "62.1K",
    comments: 2104,
  },
  {
    type: "brief",
    id: 8,
    brand: "Konga",
    logo: "K",
    industry: "E-Commerce",
    niche: "Fashion",
    budget: "₦90,000",
    deadline: "4 days left",
    slots: 4,
    proposals: 19,
    accent: "#D4A843",
    emoji: "👗",
    title: "Style It Your Way — Konga Fashion Week",
    description:
      "We want fashion creators to show off their personal style using items ordered on Konga. Unboxing, styling, real review. Make it feel like a vlog, not an ad.",
    requirements: [
      "Feature Konga app checkout",
      "Outfit must be from Konga",
      "60–120 seconds",
      "Creator must have 5K+ followers",
    ],
  },
];

// ─── AI Score Badge ───────────────────────────────────────────────────────────

function AIScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";
  const label =
    score >= 85 ? "Top Rated" : score >= 70 ? "Qualified" : "Rising";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: `${color}22`,
        border: `1px solid ${color}66`,
        borderRadius: 20,
        padding: "3px 10px",
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      <span style={{ fontSize: 11, fontWeight: 700, color }}>
        {label} · AI {score}
      </span>
    </div>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────

function CreatorCard({
  item,
  muted,
  onToggleMute,
}: {
  item: CreatorItem;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        background: "#0f0f1a",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${item.accent}33`,
        boxShadow: `0 0 40px ${item.accent}18`,
        position: "relative",
      }}
    >
      {/* Video */}
      <div style={{ position: "relative", aspectRatio: "9/14", background: "#000" }}>
        <video
          ref={videoRef}
          src={item.videoSrc}
          muted={muted}
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.95) 100%)",
          }}
        />

        {/* Top strip */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              background: item.accent,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 20,
            }}
          >
            {item.emoji} {item.niche}
          </div>

          <button
            onClick={onToggleMute}
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              color: "#fff",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Bottom overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 16px 20px",
          }}
        >
          {/* Engagement stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                borderRadius: 20,
                padding: "4px 10px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: 12 }}>👁️</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {item.views}
              </span>
            </div>

            <div
              onClick={() => setLiked((l) => !l)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: liked ? "rgba(239,68,68,0.3)" : "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                borderRadius: 20,
                padding: "4px 10px",
                border: liked
                  ? "1px solid rgba(239,68,68,0.6)"
                  : "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 12 }}>{liked ? "❤️" : "🤍"}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: liked ? "#fca5a5" : "#fff",
                }}
              >
                {liked ? item.likes + " +1" : item.likes}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                borderRadius: 20,
                padding: "4px 10px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: 12 }}>💬</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {item.comments.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Caption */}
          <p
            style={{
              color: "#f3f4f6",
              fontSize: 14,
              lineHeight: 1.5,
              margin: "0 0 12px",
              fontWeight: 500,
            }}
          >
            {item.caption}
          </p>

          {/* Creator row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${item.accent}, #000)`,
                border: `2px solid ${item.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {item.creator[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                {item.creator}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12 }}>
                {item.handle} · {item.location}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: "#fbbf24", fontSize: 13 }}>★ {item.rating}</div>
              <div style={{ color: "#6b7280", fontSize: 11 }}>{item.jobs} jobs done</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Score + CTA */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${item.accent}22`,
        }}
      >
        <AIScoreBadge score={item.aiScore} />
        <Link href="/signup/creator">
          <button
            style={{
              background: item.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            View Profile
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Brief Card ───────────────────────────────────────────────────────────────

function BriefCard({ item }: { item: BriefItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0f0f1a",
        border: `1px solid ${item.accent}44`,
        borderRadius: 24,
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "scale(1.01)" : "scale(1)",
        boxShadow: hovered
          ? `0 12px 48px ${item.accent}30`
          : `0 0 20px ${item.accent}10`,
      }}
    >
      {/* Colored top bar */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${item.accent}, transparent)`,
        }}
      />

      <div style={{ padding: 20 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${item.accent}, ${item.accent}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 20,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {item.logo}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>
              {item.brand}
            </div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{item.industry}</div>
          </div>
          <div
            style={{
              border: `2px solid ${item.accent}`,
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 800,
              color: item.accent,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Open Brief
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 10,
            lineHeight: 1.3,
          }}
        >
          {item.emoji} {item.title}
        </div>

        {/* Description */}
        <p
          style={{
            color: "#9ca3af",
            fontSize: 14,
            lineHeight: 1.65,
            margin: "0 0 16px",
            fontStyle: "italic",
          }}
        >
          &ldquo;{item.description}&rdquo;
        </p>

        {/* Requirements */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 600,
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            REQUIREMENTS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {item.requirements.map((r, i) => (
              <span
                key={i}
                style={{
                  background: "#1f2937",
                  color: "#d1d5db",
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #374151",
                }}
              >
                ✓ {r}
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#052e16",
              border: "1px solid #166534",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
              BUDGET
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>
              {item.budget}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              background: "#1c1400",
              border: "1px solid #78350f",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>
              DEADLINE
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>
              {item.deadline}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              background: "#1e1b4b",
              border: "1px solid #3730a3",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 600 }}>
              SLOTS
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#a5b4fc" }}>
              {item.slots} open
            </span>
          </div>
        </div>

        {/* Proposals avatars */}
        <div
          style={{
            color: "#6b7280",
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ display: "flex" }}>
            {[...Array(Math.min(5, item.proposals))].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: `hsl(${i * 60}, 70%, 50%)`,
                  border: "2px solid #0f0f1a",
                  marginLeft: i > 0 ? -6 : 0,
                }}
              />
            ))}
          </div>
          <span>{item.proposals} creators have submitted proposals</span>
        </div>

        {/* Locked CTA */}
        <div style={{ position: "relative" }}>
          <button
            style={{
              width: "100%",
              padding: "14px 0",
              background: `linear-gradient(90deg, ${item.accent}, ${item.accent}cc)`,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: 0.3,
              filter: "blur(3.5px)",
              pointerEvents: "none",
            }}
          >
            Submit My Proposal →
          </button>
          <Link href="/signup/creator" style={{ textDecoration: "none" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "rgba(0,0,0,0.55)",
                borderRadius: 12,
                backdropFilter: "blur(2px)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                Sign up free to apply
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeNiche, setActiveNiche] = useState("✦ All");
  const [muted, setMuted] = useState(true);

  const filteredFeed = FEED_ITEMS.filter((item) => {
    if (activeNiche === "✦ All") return true;
    // Extract just the word part after the emoji (e.g. "💻 Tech" → "Tech")
    const nicheWord = activeNiche.split(" ").slice(1).join(" ");
    return item.niche === nicheWord;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#fff",
      }}
    >
      {/* ── TOP NAV ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(8,8,16,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 24px",
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 0 10px",
          }}
        >
          <NovacloLogo />
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/how-it-works" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "7px 18px",
                borderRadius: 8,
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              How it works
            </button>
          </Link>
          <Link href="/login" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "7px 18px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid #374151",
                  color: "#9ca3af",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Log in
              </button>
            </Link>
            <Link href="/signup" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "7px 18px",
                  borderRadius: 8,
                  background: "#D4A843",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: "0 0 20px #D4A84344",
                }}
              >
                Get started →
              </button>
            </Link>
          </div>
        </div>

        {/* Niche tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 12,
            scrollbarWidth: "none",
          }}
        >
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setActiveNiche(n)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                background: activeNiche === n ? "#D4A843" : "#1a1a2e",
                color: activeNiche === n ? "#fff" : "#6b7280",
                fontWeight: activeNiche === n ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                boxShadow: activeNiche === n ? "0 0 16px #D4A84344" : "none",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </nav>

      {/* ── SCROLLABLE FEED ── */}
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "24px 16px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Hero text */}
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              margin: "0 0 6px",
              lineHeight: 1.2,
              color: "#fff",
            }}
          >
            Where creators get paid.
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #D4A843, #D4A843)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Where brands get results.
            </span>
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: 0 }}>
            Scroll to explore. Sign up to participate.
          </p>
        </div>

        {/* Feed */}
        {filteredFeed.map((item) =>
          item.type === "creator" ? (
            <CreatorCard
              key={item.id}
              item={item}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          ) : (
            <BriefCard key={item.id} item={item} />
          )
        )}

        {filteredFeed.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#4b5563",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No content in this niche yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Be the first to sign up and create it
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY BOTTOM CTA ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: "rgba(8,8,16,0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
            Ready to join?
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Free to sign up. 7-day free trial.
          </div>
        </div>
        <Link href="/signup/creator" style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "linear-gradient(90deg, #D4A843, #C49238)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            I&apos;m a Creator
          </button>
        </Link>
        <Link href="/signup/brand" style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "#ffffff",
              color: "#111827",
              fontWeight: 700,
              fontSize: 13,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            I&apos;m a Brand
          </button>
        </Link>
      </div>
    </div>
  );
}
