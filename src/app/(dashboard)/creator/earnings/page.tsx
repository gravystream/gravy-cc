import { getServerSession } from "next-auth";
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
