import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-300",
  ACTIVE: "bg-green-900/30 text-green-400",
  REVIEWING: "bg-yellow-900/30 text-yellow-400",
  IN_PROGRESS: "bg-blue-900/30 text-blue-400",
  COMPLETED: "bg-emerald-900/30 text-emerald-400",
  CANCELLED: "bg-red-900/30 text-red-400",
};

const TABS = ["All", "DRAFT", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND") redirect("/login");

  const userId = (session.user as any).id as string;
  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) redirect("/brand");

  const params = await searchParams;
  const statusFilter = params.status;

  const campaigns = await db.campaign.findMany({
    where: {
      brandId: brand.id,
      ...(statusFilter && statusFilter !== "All" ? { status: statusFilter as any } : {}),
    },
    include: { proposals: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeTab = statusFilter || "All";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/brand/campaigns/new"
          className="bg-[#D4A843] hover:bg-[#b8922e] text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + New Campaign
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "All" ? "/brand/campaigns" : `/brand/campaigns?status=${tab}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? "bg-[#D4A843] text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Campaign Cards */}
      {campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/brand/campaigns/${c.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-lg">{c.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-700 text-gray-300"}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Budget: &#8358;{Math.round(c.budgetKobo / 100).toLocaleString()}</span>
                <span>&middot;</span>
                <span>{c.proposals.length} proposal{c.proposals.length !== 1 ? "s" : ""}</span>
                <span>&middot;</span>
                <span>Deadline: {new Date(c.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>&middot;</span>
                <span>Created {new Date(c.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-2">No campaigns found.</p>
          <Link href="/brand/campaigns/new" className="text-violet-400 hover:text-violet-300">
            Create your first campaign &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
