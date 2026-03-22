"use client";
import { useRouter } from "next/navigation";
import { CreatorCard } from "@/components/ui";

type Creator = {
  id: string;
  user: { name: string | null; email: string; image: string | null };
  bio: string | null;
  niches: string[];
  ratePerPost: number | null;
  followerCount: number | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  portfolioUrl: string | null;
};

export function DiscoverCreatorGrid({ creators }: { creators: Creator[] }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-6">
      {creators.map((creator) => (
        <CreatorCard
          key={creator.id}
          creator={creator}
          onView={(id) => router.push(`/brand/creators/${id}`)}
          onHire={(id) => router.push(`/brand/campaigns/new?creatorId=${id}`)}
        />
      ))}
    </div>
  );
}
