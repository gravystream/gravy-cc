import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    redirect("/admin-login");
  }

  const [
    totalUsers,
    totalCreators,
    totalBrands,
    activeCampaigns,
    openDisputes,
    completedEscrows,
  ] = await Promise.all([
    db.user.count(),
    db.creatorProfile.count(),
    db.brandProfile.count(),
    db.campaign.count({
      where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } },
    }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.escrow.findMany({
      where: { status: "RELEASED" },
      select: { amountKobo: true },
    }),
  ]);

  const totalRevenue = completedEscrows.reduce(
    (sum, e) => sum + e.amountKobo.toNumber() / 100,
    0
  );

  const stats = [
    { label: "Total Users", value: totalUsers, icon: "👥" },
    { label: "Total Creators", value: totalCreators, icon: "🎨" },
    { label: "Total Brands", value: totalBrands, icon: "🏢" },
    { label: "Active Campaigns", value: activeCampaigns, icon: "📢" },
    {
      label: "Total Revenue",
      value: `₦${totalRevenue.toLocaleString()}`,
      icon: "💰",
    },
    { label: "Open Disputes", value: openDisputes, icon: "⚠️" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">
                {stat.label}
              </span>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
