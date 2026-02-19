import { getServerSession } from "next-auth";
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
