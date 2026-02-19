import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Star, Zap, Shield, DollarSign, Video, Users, TrendingUp, CheckCircle2, ArrowRight, Play } from "lucide-react";

// ─── Mock data for hero creator cards ────────────────────────
const FEATURED_CREATORS = [
  { name: "Adeola Okafor",  niche: "Comedy · Lifestyle",  rate: "₦15K",  rating: 4.9,  jobs: 48,  loc: "Lagos",  avail: true  },
  { name: "Emeka Nwosu",    niche: "Tech · Fintech",      rate: "₦25K",  rating: 4.8,  jobs: 36,  loc: "Abuja",  avail: true  },
  { name: "Fatima Bello",   niche: "Fashion · Beauty",    rate: "₦20K",  rating: 5.0,  jobs: 62,  loc: "Lagos",  avail: false },
  { name: "Chidi Eze",      niche: "Food · Lifestyle",    rate: "₦18K",  rating: 4.7,  jobs: 29,  loc: "PH",     avail: true  },
  { name: "Ngozi Adeyemi",  niche: "Beauty · Skincare",   rate: "₦22K",  rating: 4.9,  jobs: 55,  loc: "Lagos",  avail: true  },
  { name: "Kola Olanrewaju",niche: "Sports · Fitness",    rate: "₦16K",  rating: 4.6,  jobs: 21,  loc: "Ibadan", avail: false },
];

const HOW_IT_WORKS = {
  creators: [
    { n: "01", title: "Sign Up & Build Profile",  desc: "Create your portfolio, set your niche, rate and availability." },
    { n: "02", title: "Browse Campaign Briefs",    desc: "Discover open campaigns from brands matching your niche." },
    { n: "03", title: "Submit Proposal Videos",   desc: "Record a pitch video. AI scores quality & relevance." },
    { n: "04", title: "Get Paid via Escrow",       desc: "Brand holds payment upfront. You get paid on approval." },
  ],
  brands: [
    { n: "01", title: "Post a Campaign Brief",     desc: "Describe your brief, budget, and deadline. Funds held in escrow." },
    { n: "02", title: "AI Filters Submissions",    desc: "Only quality-scored proposals above threshold reach your inbox." },
    { n: "03", title: "Select Your Creator",       desc: "Browse qualified proposals. Direct hire or open campaign." },
    { n: "04", title: "Approve & Release",         desc: "Review the final video, approve and payment is released." },
  ],
};

const STATS = [
  { v: "50K+",  l: "Active Creators" },
  { v: "12K+",  l: "Campaigns Run" },
  { v: "₦2B+",  l: "GMV Processed" },
  { v: "4.9★",  l: "Avg Creator Rating" },
];

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "AI Quality Gate",
    desc: "Every submission is scored 0-100 on video quality, audio clarity and brief relevance. Only the best reach brands.",
    color: "#D4A843",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Escrow Protection",
    desc: "Brands deposit funds upfront. Creators work with confidence knowing payment is secured and held until approval.",
    color: "#22C55E",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Flexible Campaigns",
    desc: "Post open briefs to receive many proposals, or direct hire a specific creator you love — both with escrow.",
    color: "#60A5FA",
  },
  {
    icon: <Video className="w-5 h-5" />,
    title: "TikTok-Style Discovery",
    desc: "Browse creator talent like a TikTok feed. Filter by niche, location, rating, price and platform specialty.",
    color: "#EF4444",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Proposal Pitching",
    desc: "Creators record video pitches explaining their creative approach — brands see passion, not just a quote.",
    color: "#A78BFA",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Real-Time Analytics",
    desc: "Track campaign performance, creator ratings, spend history and ROI — all in one beautiful dashboard.",
    color: "#F59E0B",
  },
];

const PRICING = [
  {
    role: "Creator",
    price: "₦10,000",
    period: "/month",
    trial: "7-day free trial",
    popular: false,
    features: [
      "Browse all open campaign briefs",
      "Submit unlimited proposals",
      "Accept direct hire offers",
      "AI feedback on every submission",
      "Portfolio visible to all brands",
      "Earnings dashboard & wallet",
      "Real-time notifications",
    ],
    cta: "Start as Creator ✦",
    href: "/signup/creator",
  },
  {
    role: "Brand",
    price: "₦5,000",
    period: "/month",
    trial: "7-day free trial",
    popular: true,
    features: [
      "Full creator discovery feed",
      "Post unlimited campaigns",
      "AI-filtered qualified proposals only",
      "Direct hire any creator",
      "Escrow payment system",
      "Campaign management & analytics",
      "Pause any month you don't need it",
    ],
    cta: "Start as Brand →",
    href: "/signup/brand",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gravy-hero pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#D4A843]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Announce badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E1E1E] border border-[#2D2D2D] text-xs text-[#D4A843] font-medium mb-8 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-pulse" />
              Now open to all creators & brands across Nigeria
              <ArrowRight className="w-3 h-3" />
            </div>

            {/* Headline */}
            <h1 className="font-quicksand font-bold tracking-tight animate-slide-up"
              style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: "1.06" }}>
              <span className="text-white">Where Great Brands</span>
              <br />
              <span className="text-white">Find </span>
              <span className="relative inline-block">
                <span className="text-[#D4A843]">Creator Magic</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                  <path d="M0 5 Q50 0 100 3 Q150 6 200 2" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </span>
            </h1>

            <p className="mt-8 text-lg text-[#808080] max-w-2xl mx-auto leading-relaxed animate-fade-in">
              The AI-powered creator marketplace where brands commission premium video content,
              and creators build careers — with escrow protection on every deal.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in">
              <Link href="/signup/creator">
                <Button variant="primary" size="lg" className="min-w-[220px]">
                  Join as Creator ✦
                </Button>
              </Link>
              <Link href="/signup/brand">
                <Button variant="gold" size="lg" className="min-w-[220px]">
                  Find Creators →
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <div className="flex -space-x-2">
                {["A","B","C","D","E"].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#2D2D2D] border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-bold text-white">
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#808080]">
                <span className="text-white font-semibold">2,400+ creators</span> already on the platform
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1E1E1E] rounded-2xl overflow-hidden mb-16 animate-slide-up">
            {STATS.map((s) => (
              <div key={s.l} className="bg-[#0A0A0A] px-6 py-6 text-center">
                <div className="text-3xl font-bold text-white font-quicksand mb-1">{s.v}</div>
                <div className="text-sm text-[#808080]">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Featured creator cards preview */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white font-quicksand">Featured Creators</h2>
                <p className="text-sm text-[#808080] mt-1">Talent ready for your next campaign</p>
              </div>
              <Link href="/signup/brand">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight className="w-4 h-4" />}>
                  Browse all
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {FEATURED_CREATORS.map((c) => (
                <div key={c.name} className="card-hover p-4 group cursor-pointer">
                  {/* Avatar */}
                  <div className="relative mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#2D2D2D] flex items-center justify-center font-bold text-lg text-white font-quicksand mx-auto">
                      {c.name[0]}
                    </div>
                    {c.avail && (
                      <span className="absolute bottom-0 right-[calc(50%-6px)] w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#0A0A0A]" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-[#808080] truncate mb-2">{c.niche}</div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="w-3 h-3 fill-[#D4A843] text-[#D4A843]" />
                      <span className="text-xs font-semibold text-white">{c.rating}</span>
                    </div>
                    <div className="text-xs font-bold text-white">from {c.rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-[#0A0A0A] border-t border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4">Platform Features</div>
            <h2 className="text-display-sm text-white font-quicksand mb-4">
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
            <p className="text-[#808080] max-w-xl mx-auto">
              Built from the ground up for video content creators and the brands that want to work with them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 group hover:border-[#444444] transition-colors duration-200">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${f.color}15`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white font-quicksand mb-2">{f.title}</h3>
                <p className="text-sm text-[#808080] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-24 border-t border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4">How It Works</div>
            <h2 className="text-display-sm text-white font-quicksand mb-4">
              Two ways to use Gravy.<br />Both powered by AI.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* For Creators */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#D4A843]/15 flex items-center justify-center">
                  <Video className="w-5 h-5 text-[#D4A843]" />
                </div>
                <h3 className="text-lg font-bold text-white font-quicksand">For Creators</h3>
              </div>
              <div className="space-y-5">
                {HOW_IT_WORKS.creators.map((step, i) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#D4A843] font-quicksand">
                      {step.n}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
                      <div className="text-xs text-[#808080] leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/signup/creator">
                  <Button variant="primary" size="md" className="w-full">
                    Join as Creator ✦
                  </Button>
                </Link>
              </div>
            </div>

            {/* For Brands */}
            <div className="card p-8 border-[#D4A843]/30">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#D4A843]/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#D4A843]" />
                </div>
                <h3 className="text-lg font-bold text-white font-quicksand">For Brands</h3>
              </div>
              <div className="space-y-5">
                {HOW_IT_WORKS.brands.map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#D4A843]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#D4A843] font-quicksand">
                      {step.n}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
                      <div className="text-xs text-[#808080] leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/signup/brand">
                  <Button variant="gold" size="md" className="w-full">
                    Start Finding Creators →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-24 border-t border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-[#D4A843] uppercase tracking-widest mb-4">Pricing</div>
            <h2 className="text-display-sm text-white font-quicksand mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-[#808080] max-w-md mx-auto">
              Start free for 7 days. Cancel or pause anytime. Platform commission only on completed jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.role}
                className={`card p-8 relative ${plan.popular ? "border-[#D4A843]/40" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-[#D4A843] text-black text-xs font-bold rounded-full font-quicksand">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Trial badge */}
                <div className="mb-6">
                  <Badge variant="trial" dot={false}>{plan.trial}</Badge>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-semibold text-[#808080] uppercase tracking-wider">For {plan.role}s</span>
                </div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-5xl font-bold text-white font-quicksand">{plan.price}</span>
                  <span className="text-[#808080] mb-1.5">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#C7C7C7]">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    variant={plan.popular ? "gold" : "primary"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#444444] mt-8">
            + 10% platform commission on completed campaigns · All prices in NGN · Paystack & Stripe accepted
          </p>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────── */}
      <section className="py-24 border-t border-[#1E1E1E]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#D4A843]/5 rounded-3xl blur-xl pointer-events-none" />
            <div className="relative card border-[#D4A843]/20 p-16">
              <h2 className="text-display-md text-white font-quicksand mb-6">
                Ready to make your<br />
                <span className="text-[#D4A843]">first great collab?</span>
              </h2>
              <p className="text-[#808080] mb-10 max-w-md mx-auto">
                Join thousands of creators earning from their craft and brands getting content that converts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup/creator">
                  <Button variant="primary" size="lg">Start as Creator ✦</Button>
                </Link>
                <Link href="/signup/brand">
                  <Button variant="gold" size="lg">Find Creators →</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
