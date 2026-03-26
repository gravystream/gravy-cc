import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminCampaignsPage() {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    redirect("/admin-login");
  }

  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: {
        include: { user: { select: { name: true } } },
      },
      _count: { select: { proposals: true } },
    },
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-700/50 text-gray-400 border-gray-600",
      ACTIVE: "bg-green-900/50 text-green-400 border-green-800",
      IN_PROGRESS: "bg-blue-900/50 text-blue-400 border-blue-800",
      COMPLETED: "bg-purple-900/50 text-purple-400 border-purple-800",
      CANCELLED: "bg-red-900/50 text-red-400 border-red-800",
    };
    return colors[status] || "bg-gray-700/50 text-gray-400 border-gray-600";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Campaigns</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Title</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Brand</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Budget</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Proposals</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-6 py-4 text-white font-medium">{campaign.title}</td>
                <td className="px-6 py-4 text-gray-300">{campaign.brand?.user?.name || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(campaign.status)}`}>
                    {campaign.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">₦{((campaign.budgetKobo || 0) / 100).toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-300">{campaign._count.proposals}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <p className="text-gray-500 text-center py-8">No campaigns found.</p>
        )}
      </div>
    </div>
  );
}
