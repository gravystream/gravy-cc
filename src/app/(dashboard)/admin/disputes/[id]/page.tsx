import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    redirect("/admin-login");
  }

  const { id } = await params;

  const dispute = await db.dispute.findUnique({
    where: { id },
    include: {
      campaign: {
        include: {
          brand: { include: { user: { select: { name: true, email: true } } } },
          escrow: { select: { amount: true, status: true } },
        },
      },
      raisedBy: { select: { name: true, email: true, role: true } },
    },
  });

  if (!dispute) {
    redirect("/admin/disputes");
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-900/50 text-red-400 border-red-800",
    UNDER_REVIEW: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
    RESOLVED: "bg-green-900/50 text-green-400 border-green-800",
    CLOSED: "bg-gray-700/50 text-gray-400 border-gray-600",
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">
          Dispute #{dispute.id.slice(0, 8)}
        </h1>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[dispute.status] || statusColors.CLOSED}`}>
          {dispute.status.replace("_", " ")}
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Reason</p>
            <p className="text-white">{dispute.reason}</p>
          </div>
          {dispute.description && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Description</p>
              <p className="text-gray-300 whitespace-pre-wrap">{dispute.description}</p>
            </div>
          )}
          {dispute.evidence && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Evidence</p>
              <p className="text-gray-300 whitespace-pre-wrap">{dispute.evidence}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-sm mb-1">Raised By</p>
            <p className="text-white">
              {dispute.raisedBy?.name || "—"} ({dispute.raisedBy?.email}) —{" "}
              <span className="text-gray-400">{dispute.raisedBy?.role}</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Created</p>
            <p className="text-gray-300">{new Date(dispute.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {dispute.campaign && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Campaign & Escrow</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Campaign</p>
              <p className="text-white">{dispute.campaign.title}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Brand</p>
              <p className="text-white">{dispute.campaign.brand?.user?.name || "—"}</p>
            </div>
            {dispute.campaign.escrow && (
              <>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Escrow Amount</p>
                  <p className="text-white">₦{dispute.campaign.escrow.amount.toNumber().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Escrow Status</p>
                  <p className="text-white">{dispute.campaign.escrow.status}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Take Action</h2>
        <form action={`/api/admin/disputes/${dispute.id}`} method="POST">
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">Update Status</label>
            <select name="status" defaultValue={dispute.status}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500">
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED_BRAND">Resolve for Brand</option>
              <option value="RESOLVED_CREATOR">Resolve for Creator</option>
              <option value="CLOSED">Close</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">Resolution Notes</label>
            <textarea name="resolution" rows={4} placeholder="Add notes about this resolution..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <button type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Update Dispute
          </button>
        </form>
      </div>
    </div>
  );
}
