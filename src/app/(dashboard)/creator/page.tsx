import { getServerSession } from "next-auth";
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
