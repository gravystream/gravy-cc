import { getServerSession } from "next-auth";
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
