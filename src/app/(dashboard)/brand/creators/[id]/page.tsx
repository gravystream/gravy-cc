"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Star, CheckCircle, Instagram, Youtube, Twitter,
  ExternalLink, Clock, Briefcase, MessageCircle, DollarSign, MapPin
} from "lucide-react";

type CreatorProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  niches: string[];
  platforms: string[];
  baseRateKobo: number | null;
  isVerified: boolean;
  totalJobsCompleted: number;
  avgRating: number | null;
  totalReviews: number;
  responseTimeHours: number | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  twitterUrl: string | null;
};

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleStartChat = async () => {
    setIsStartingChat(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: creator.id }),
      });
      if (!res.ok) throw new Error('Failed to start conversation');
      const data = await res.json();
      router.push(`/brand/messages/${data.conversationId}`);
    } catch (err) {
      console.error(err);
      setIsStartingChat(false);
    }
  };
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creators/${params.id}`)
      .then((r) => r.json())
      .then((data) => setCreator(data.creator ?? data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Creator not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-violet-400 hover:text-violet-300 text-sm">
             Go back
          </button>
        </div>
      </div>
    );
  }

  const rateNaira = creator.baseRateKobo ? (creator.baseRateKobo / 100).toLocaleString() : null;
  const displayName = creator.displayName || creator.username;
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Back button */}
      <div className="px-6 pt-5 pb-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-12">
        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
          {/* Cover banner */}
          <div className="relative h-44 bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-700">
            {creator.coverUrl && (
              <Image src={creator.coverUrl} alt="cover" fill className="object-cover opacity-60" />
            )}
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/60" />
          </div>

          {/* Profile header  avatar overlaps cover */}
          <div className="px-8 pb-8">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-14 mb-5">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full ring-4 ring-gray-900 overflow-hidden bg-violet-700 flex items-center justify-center flex-shrink-0">
                {creator.avatarUrl ? (
                  <Image src={creator.avatarUrl} alt={displayName} fill className="object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">{initials}</span>
                )}
                {creator.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-violet-500 rounded-full p-0.5 ring-2 ring-gray-900">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Hire button  top right */}
              <button
                onClick={() => router.push('/brand/contracts/new?creatorId=' + params.id)}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/40 text-sm"
              >
                Hire This Creator
              </button>
            </div>

            {/* Name + handle + location */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white text-2xl font-bold leading-tight">{displayName}</h1>
                {creator.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-violet-300 bg-violet-900/50 px-2 py-0.5 rounded-full border border-violet-700/50">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">@{creator.username}</p>
              {creator.location && (
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {creator.location}
                </p>
              )}
            </div>

            {/* Tagline */}
            {creator.tagline && (
              <p className="text-violet-300 text-sm italic mb-4">&ldquo;{creator.tagline}&rdquo;</p>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-yellow-400 mb-1">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span className="text-white font-bold text-lg">{creator.avgRating?.toFixed(1) ?? ""}</span>
                </div>
                <p className="text-gray-400 text-xs">{creator.totalReviews} review{creator.totalReviews !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Briefcase className="w-4 h-4 text-violet-400" />
                  <span className="text-white font-bold text-lg">{creator.totalJobsCompleted}</span>
                </div>
                <p className="text-gray-400 text-xs">Jobs completed</p>
              </div>
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-bold text-lg">
                    {creator.responseTimeHours ? `~${creator.responseTimeHours}h` : ""}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">Response time</p>
              </div>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left  bio & niches */}
              <div className="md:col-span-2 space-y-5">
                {creator.bio && (
                  <div>
                    <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-2">About</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{creator.bio}</p>
                  </div>
                )}

                {creator.niches.length > 0 && (
                  <div>
                    <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-2">Niches</h3>
                    <div className="flex flex-wrap gap-2">
                      {creator.niches.map((n) => (
                        <span
                          key={n}
                          className="px-3 py-1 text-xs font-medium rounded-full bg-violet-900/40 border border-violet-700/50 text-violet-300"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                {(creator.instagramUrl || creator.tiktokUrl || creator.youtubeUrl || creator.twitterUrl) && (
                  <div>
                    <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-2">Socials</h3>
                    <div className="flex items-center gap-3">
                      {creator.instagramUrl && (
                        <a href={creator.instagramUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 text-xs font-medium transition-colors">
                          <Instagram className="w-4 h-4" /> Instagram
                        </a>
                      )}
                      {creator.tiktokUrl && (
                        <a href={creator.tiktokUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors">
                          <ExternalLink className="w-4 h-4" /> TikTok
                        </a>
                      )}
                      {creator.youtubeUrl && (
                        <a href={creator.youtubeUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-medium transition-colors">
                          <Youtube className="w-4 h-4" /> YouTube
                        </a>
                      )}
                      {creator.twitterUrl && (
                        <a href={creator.twitterUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors">
                          <Twitter className="w-4 h-4" /> X / Twitter
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right  rate card */}
              <div className="md:col-span-1">
                <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Starting rate</p>
                    <div className="flex items-baseline gap-1">
                      <DollarSign className="w-4 h-4 text-violet-400 mt-1" />
                      <span className="text-white text-2xl font-bold">
                        {rateNaira ?? ""}
                      </span>
                      <span className="text-gray-400 text-sm">/ post</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700/50 pt-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Platforms</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {creator.platforms.length > 0 ? creator.platforms.map((p) => (
                        <span key={p} className="px-2.5 py-1 text-xs bg-gray-700/60 border border-gray-600/50 rounded-lg text-gray-300">{p}</span>
                      )) : <span className="text-gray-500 text-xs">Not specified</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/brand/contracts/new?creatorId=' + params.id)}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30 text-sm mt-2"
                  >
                    Hire This Creator
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="w-full py-2.5 border border-gray-600 hover:border-violet-500 hover:text-violet-300 text-gray-300 font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
