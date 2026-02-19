#!/usr/bin/env python3
import os

def mkfile(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  created: {path}")

base = '/var/www/gravy-cc-deploy'
os.chdir(base)

# 1. prisma/schema.prisma
mkfile('prisma/schema.prisma', '''// Novaclio - AI Creator Marketplace
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  role          UserRole  @default(CREATOR)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  creator       Creator?
  brand         Brand?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Creator {
  id            String     @id @default(cuid())
  userId        String     @unique
  bio           String?    @db.Text
  niche         String[]
  platforms     Json       @default("{}")
  followers     Int        @default(0)
  engagementRate Float     @default(0)
  aiScore       Float      @default(0)
  location      String?
  ratePerPost   Float?
  portfolioUrl  String?
  verified      Boolean    @default(false)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  proposals     Proposal[]
}

model Brand {
  id          String     @id @default(cuid())
  userId      String     @unique
  company     String
  website     String?
  industry    String?
  logo        String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaigns   Campaign[]
}

model Campaign {
  id           String       @id @default(cuid())
  brandId      String
  title        String
  description  String       @db.Text
  budget       Float
  deadline     DateTime
  niche        String[]
  platforms    String[]
  requirements String?      @db.Text
  status       CampaignStatus @default(ACTIVE)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  brand        Brand        @relation(fields: [brandId], references: [id], onDelete: Cascade)
  proposals    Proposal[]
}

model Proposal {
  id          String         @id @default(cuid())
  campaignId  String
  creatorId   String
  pitch       String         @db.Text
  rate        Float
  aiScore     Float?
  aiFeedback  String?        @db.Text
  status      ProposalStatus @default(PENDING)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  campaign    Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  creator     Creator        @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  payments    Payment[]
}

model Payment {
  id           String        @id @default(cuid())
  proposalId   String
  amount       Float
  currency     String        @default("NGN")
  reference    String        @unique
  status       PaymentStatus @default(PENDING)
  paystackRef  String?
  createdAt    DateTime      @default(now())
  proposal     Proposal      @relation(fields: [proposalId], references: [id], onDelete: Cascade)
}

enum UserRole {
  CREATOR
  BRAND
  ADMIN
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum ProposalStatus {
  PENDING
  REVIEWING
  ACCEPTED
  REJECTED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}
''')

# 2. vps-configs/deploy.sh
mkfile('vps-configs/deploy.sh', '''#!/bin/bash
# Novaclio Deploy Script
# Usage: ./vps-configs/deploy.sh
set -e

APP_DIR="/var/www/gravy-cc-deploy"
echo "Deploying Novaclio..."

cd $APP_DIR

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm ci --omit=dev

echo "Generating Prisma client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy

echo "Building app..."
npm run build

echo "Restarting PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "Deployment complete!"
pm2 status
''')

# 3. src/app/(auth)/login/page.tsx
mkfile('src/app/(auth)/login/page.tsx', '''"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to your Novaclio account</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
''')

# 4. src/app/(auth)/signup/page.tsx
mkfile('src/app/(auth)/signup/page.tsx', '''"use client";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Join Novaclio</h1>
          <p className="text-gray-400 mt-2">Choose how you want to use Novaclio</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/signup/creator">
            <div className="bg-gray-900 border border-gray-800 hover:border-violet-500 rounded-2xl p-6 cursor-pointer transition-all text-center group">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-white font-semibold text-lg">Creator</h3>
              <p className="text-gray-400 text-sm mt-2">Find brand deals and grow your income</p>
            </div>
          </Link>

          <Link href="/signup/brand">
            <div className="bg-gray-900 border border-gray-800 hover:border-violet-500 rounded-2xl p-6 cursor-pointer transition-all text-center group">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-white font-semibold text-lg">Brand</h3>
              <p className="text-gray-400 text-sm mt-2">Discover creators and run campaigns</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
''')

# 5. src/app/(auth)/signup/brand/page.tsx
mkfile('src/app/(auth)/signup/brand/page.tsx', '''"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BrandSignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", industry: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "BRAND" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); }
    else router.push("/login?registered=1");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Brand Sign Up</h1>
          <p className="text-gray-400 mt-2">Create your brand account</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            {[["name","Full Name","text"],["email","Email","email"],["password","Password","password"],["company","Company Name","text"],["industry","Industry","text"]].map(([field, label, type]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                <input type={type} value={(form as any)[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? "Creating account..." : "Create Brand Account"}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-4 text-sm">
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">← Back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
''')

# 6. src/app/(auth)/signup/creator/page.tsx
mkfile('src/app/(auth)/signup/creator/page.tsx', '''"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatorSignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", niche: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "CREATOR", niche: form.niche.split(",").map(n => n.trim()) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); }
    else router.push("/login?registered=1");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Creator Sign Up</h1>
          <p className="text-gray-400 mt-2">Start monetizing your content</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            {[["name","Full Name","text"],["email","Email","email"],["password","Password","password"]].map(([field, label, type]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                <input type={type} value={(form as any)[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Niche (comma-separated)</label>
              <input type="text" placeholder="fashion, beauty, tech" value={form.niche} onChange={e => setForm({...form, niche: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? "Creating account..." : "Create Creator Account"}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-4 text-sm">
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">← Back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
''')

# 7. src/app/(dashboard)/brand/layout.tsx
mkfile('src/app/(dashboard)/brand/layout.tsx', '''import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "BRAND") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Novaclio</h2>
          <p className="text-gray-400 text-sm">Brand Portal</p>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { href: "/brand", label: "Dashboard", icon: "📊" },
            { href: "/brand/discover", label: "Discover", icon: "🔍" },
            { href: "/brand/campaigns/new", label: "New Campaign", icon: "➕" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="pt-6 border-t border-gray-800">
          <p className="text-gray-400 text-sm">{session.user?.email}</p>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
''')

# 8. src/app/(dashboard)/brand/page.tsx
mkfile('src/app/(dashboard)/brand/page.tsx', '''import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatCard } from "@/components/ui";
import Link from "next/link";

export default async function BrandDashboard() {
  const session = await getServerSession(authOptions);
  const brand = await db.brand.findFirst({ where: { user: { email: session?.user?.email! } }, include: { campaigns: { include: { proposals: true } } } });

  const totalCampaigns = brand?.campaigns.length ?? 0;
  const totalProposals = brand?.campaigns.reduce((s, c) => s + c.proposals.length, 0) ?? 0;
  const activeCampaigns = brand?.campaigns.filter(c => c.status === "ACTIVE").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Brand Dashboard</h1>
          <p className="text-gray-400">Manage your campaigns and creators</p>
        </div>
        <Link href="/brand/campaigns/new"
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          + New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Campaigns" value={totalCampaigns} />
        <StatCard label="Active Campaigns" value={activeCampaigns} />
        <StatCard label="Total Proposals" value={totalProposals} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Campaigns</h2>
        {brand?.campaigns.length ? (
          <div className="space-y-4">
            {brand.campaigns.slice(0,5).map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">{c.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-400"}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{c.proposals.length} proposals · Budget: ₦{c.budget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400">No campaigns yet.</p>
            <Link href="/brand/campaigns/new" className="text-violet-400 hover:text-violet-300 mt-2 inline-block">Create your first campaign →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
''')

# 9. src/app/(dashboard)/brand/campaigns/new/page.tsx
mkfile('src/app/(dashboard)/brand/campaigns/new/page.tsx', '''"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaignPage() {
  const [form, setForm] = useState({ title: "", description: "", budget: "", deadline: "", niche: "", platforms: "", requirements: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget: parseFloat(form.budget),
        deadline: new Date(form.deadline).toISOString(),
        niche: form.niche.split(",").map(n => n.trim()),
        platforms: form.platforms.split(",").map(p => p.trim()),
      }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setLoading(false); }
    else router.push("/brand");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Create Campaign</h1>
      <p className="text-gray-400 mb-8">Set up a new influencer campaign</p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
          {[["title","Campaign Title","text"],["budget","Budget (₦)","number"],["deadline","Deadline","date"],["niche","Niches (comma-separated)","text"],["platforms","Platforms (comma-separated)","text"]].map(([field,label,type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={e => setForm({...form,[field]:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea rows={4} value={form.description} onChange={e => setForm({...form,description:e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm({...form,requirements:e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}
''')

# 10. src/app/(dashboard)/brand/discover/page.tsx
mkfile('src/app/(dashboard)/brand/discover/page.tsx', '''import { db } from "@/lib/db";
import { CreatorCard } from "@/components/ui";

export default async function DiscoverPage({ searchParams }: { searchParams: { niche?: string } }) {
  const creators = await db.creator.findMany({
    where: searchParams.niche ? { niche: { has: searchParams.niche } } : undefined,
    include: { user: true },
    orderBy: { aiScore: "desc" },
    take: 24,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Discover Creators</h1>
        <p className="text-gray-400">Find the perfect creators for your campaigns</p>
      </div>

      {creators.length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {creators.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No creators found. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
''')

# 11. src/app/(dashboard)/creator/layout.tsx
mkfile('src/app/(dashboard)/creator/layout.tsx', '''import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "CREATOR") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Novaclio</h2>
          <p className="text-gray-400 text-sm">Creator Portal</p>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { href: "/creator", label: "Dashboard", icon: "📊" },
            { href: "/creator/briefs", label: "Browse Briefs", icon: "📋" },
            { href: "/creator/proposals", label: "My Proposals", icon: "📤" },
            { href: "/creator/earnings", label: "Earnings", icon: "💰" },
            { href: "/creator/profile", label: "Profile", icon: "👤" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="pt-6 border-t border-gray-800">
          <p className="text-gray-400 text-sm">{session.user?.email}</p>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
''')

# 12. src/app/(dashboard)/creator/page.tsx
mkfile('src/app/(dashboard)/creator/page.tsx', '''import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatCard, AIScoreRing } from "@/components/ui";
import Link from "next/link";

export default async function CreatorDashboard() {
  const session = await getServerSession(authOptions);
  const creator = await db.creator.findFirst({
    where: { user: { email: session?.user?.email! } },
    include: { proposals: { include: { campaign: { include: { brand: { include: { user: true } } } } } } },
  });

  const totalProposals = creator?.proposals.length ?? 0;
  const acceptedProposals = creator?.proposals.filter(p => p.status === "ACCEPTED").length ?? 0;
  const totalEarnings = creator?.proposals.filter(p => p.status === "COMPLETED").reduce((s, p) => s + p.rate, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
          <p className="text-gray-400">Track your campaigns and earnings</p>
        </div>
        {creator && <AIScoreRing score={creator.aiScore} />}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Proposals" value={totalProposals} />
        <StatCard label="Accepted" value={acceptedProposals} />
        <StatCard label="Earned" value={`₦${totalEarnings.toLocaleString()}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        {creator?.proposals.length ? (
          <div className="space-y-4">
            {creator.proposals.slice(0,5).map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">{p.campaign.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === "ACCEPTED" ? "bg-green-900/30 text-green-400" : p.status === "REJECTED" ? "bg-red-900/30 text-red-400" : "bg-yellow-900/30 text-yellow-400"}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">Rate: ₦{p.rate.toLocaleString()} · {p.campaign.brand.user.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400">No proposals yet.</p>
            <Link href="/creator/briefs" className="text-violet-400 hover:text-violet-300 mt-2 inline-block">Browse campaigns →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
''')

# 13. src/app/(dashboard)/creator/briefs/page.tsx
mkfile('src/app/(dashboard)/creator/briefs/page.tsx', '''import { db } from "@/lib/db";
import Link from "next/link";

export default async function BriefsPage() {
  const campaigns = await db.campaign.findMany({
    where: { status: "ACTIVE" },
    include: { brand: { include: { user: true } }, proposals: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Browse Briefs</h1>
        <p className="text-gray-400">Find campaigns that match your style</p>
      </div>

      {campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{c.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{c.brand.user.name} · {c.brand.industry}</p>
                  <p className="text-gray-300 text-sm mt-3 line-clamp-2">{c.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.niche.map(n => <span key={n} className="bg-violet-900/30 text-violet-400 px-2 py-1 rounded-md text-xs">{n}</span>)}
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-white font-semibold">₦{c.budget.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-1">{c.proposals.length} proposals</p>
                  <Link href={`/creator/briefs/${c.id}`}
                    className="inline-block mt-3 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    Apply →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No active campaigns right now. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
''')

# 14. src/app/(dashboard)/creator/proposals/page.tsx
mkfile('src/app/(dashboard)/creator/proposals/page.tsx', '''import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ProposalsPage() {
  const session = await getServerSession(authOptions);
  const creator = await db.creator.findFirst({ where: { user: { email: session?.user?.email! } } });
  const proposals = creator ? await db.proposal.findMany({
    where: { creatorId: creator.id },
    include: { campaign: { include: { brand: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  }) : [];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-900/30 text-yellow-400",
    REVIEWING: "bg-blue-900/30 text-blue-400",
    ACCEPTED: "bg-green-900/30 text-green-400",
    REJECTED: "bg-red-900/30 text-red-400",
    COMPLETED: "bg-gray-700 text-gray-300",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Proposals</h1>
        <p className="text-gray-400">Track all your campaign applications</p>
      </div>

      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{p.campaign.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{p.campaign.brand.user.name} · Rate: ₦{p.rate.toLocaleString()}</p>
                  {p.aiScore && <p className="text-violet-400 text-xs mt-1">AI Score: {p.aiScore}/100</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || ""}`}>{p.status}</span>
              </div>
              {p.aiFeedback && <p className="text-gray-400 text-sm mt-3 bg-gray-800 rounded-lg p-3">{p.aiFeedback}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No proposals yet.</p>
        </div>
      )}
    </div>
  );
}
''')

# 15. src/app/(dashboard)/creator/earnings/page.tsx
mkfile('src/app/(dashboard)/creator/earnings/page.tsx', '''import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatCard } from "@/components/ui";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  const creator = await db.creator.findFirst({ where: { user: { email: session?.user?.email! } } });
  const proposals = creator ? await db.proposal.findMany({
    where: { creatorId: creator.id, status: { in: ["ACCEPTED","COMPLETED"] } },
    include: { campaign: { include: { brand: { include: { user: true } } } }, payments: true },
    orderBy: { createdAt: "desc" },
  }) : [];

  const totalEarned = proposals.filter(p => p.status === "COMPLETED").reduce((s, p) => s + p.rate, 0);
  const pending = proposals.filter(p => p.status === "ACCEPTED").reduce((s, p) => s + p.rate, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Earnings</h1>
        <p className="text-gray-400">Track your income from campaigns</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Earned" value={`₦${totalEarned.toLocaleString()}`} />
        <StatCard label="Pending Payout" value={`₦${pending.toLocaleString()}`} />
        <StatCard label="Completed Deals" value={proposals.filter(p => p.status === "COMPLETED").length} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
        {proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{p.campaign.title}</h3>
                  <p className="text-gray-400 text-sm">{p.campaign.brand.user.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">₦{p.rate.toLocaleString()}</p>
                  <span className={`text-xs ${p.status === "COMPLETED" ? "text-green-400" : "text-yellow-400"}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400">No earnings yet. Apply to campaigns to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
''')

# 16. src/app/(dashboard)/creator/profile/page.tsx
mkfile('src/app/(dashboard)/creator/profile/page.tsx', '''"use client";
import { useState, useEffect } from "react";

export default function CreatorProfilePage() {
  const [form, setForm] = useState({ bio: "", niche: "", followers: "", engagementRate: "", ratePerPost: "", portfolioUrl: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, niche: form.niche.split(",").map(n => n.trim()), followers: parseInt(form.followers), engagementRate: parseFloat(form.engagementRate), ratePerPost: parseFloat(form.ratePerPost) }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Your Profile</h1>
      <p className="text-gray-400 mb-8">Update your creator profile to attract brands</p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {saved && <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">Profile saved!</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm({...form,bio:e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
          </div>
          {[["niche","Niches (comma-separated)","text"],["followers","Followers","number"],["engagementRate","Engagement Rate (%)","number"],["ratePerPost","Rate Per Post (₦)","number"],["portfolioUrl","Portfolio URL","url"]].map(([field,label,type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={e => setForm({...form,[field]:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
''')

# 17. src/app/api/campaigns/route.ts
mkfile('src/app/api/campaigns/route.ts', '''import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche");
    const campaigns = await db.campaign.findMany({
      where: { status: "ACTIVE", ...(niche ? { niche: { has: niche } } : {}) },
      include: { brand: { include: { user: { select: { name: true, email: true } } } }, proposals: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brand = await db.brand.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    const body = await req.json();
    const campaign = await db.campaign.create({
      data: {
        brandId: brand.id,
        title: body.title,
        description: body.description,
        budget: body.budget,
        deadline: new Date(body.deadline),
        niche: body.niche || [],
        platforms: body.platforms || [],
        requirements: body.requirements,
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
''')

# 18. src/app/api/campaigns/[id]/proposals/route.ts
mkfile('src/app/api/campaigns/[id]/proposals/route.ts', '''import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkProposalWithAI } from "@/lib/ai";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposals= await db.proposal.findMany({
      where: { campaignId: params.id },
      include: { creator: { include: { user: { select: { name: true, email: true, image: true } } } } },
      orderBy: { aiScore: "desc" },
    });
    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creator = await db.creator.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });

    const campaign = await db.campaign.findUnique({ where: { id: params.id } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const body = await req.json();

    // AI check
    let aiScore = null;
    let aiFeedback = null;
    try {
      const result = await checkProposalWithAI({ pitch: body.pitch, campaign, creator });
      aiScore = result.score;
      aiFeedback = result.feedback;
    } catch (e) {
      console.error("AI check failed:", e);
    }

    const proposal = await db.proposal.create({
      data: {
        campaignId: params.id,
        creatorId: creator.id,
        pitch: body.pitch,
        rate: body.rate,
        aiScore,
        aiFeedback,
      },
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
''')

# 19. src/app/api/webhooks/paystack/route.ts
mkfile('src/app/api/webhooks/paystack/route.ts', '''import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    // Verify webhook signature
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, status } = event.data;
      if (status === "success") {
        await db.payment.update({
          where: { reference },
          data: { status: "SUCCESS", paystackRef: event.data.id?.toString() },
        });

        // Update proposal status to completed
        const payment = await db.payment.findUnique({ where: { reference }, include: { proposal: true } });
        if (payment) {
          await db.proposal.update({
            where: { id: payment.proposalId },
            data: { status: "COMPLETED" },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
''')

print("\\nAll 19 files created successfully!")
