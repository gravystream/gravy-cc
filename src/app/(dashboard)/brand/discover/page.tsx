import { db } from "@/lib/db";
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
