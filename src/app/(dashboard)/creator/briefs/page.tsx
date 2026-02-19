import { db } from "@/lib/db";
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
