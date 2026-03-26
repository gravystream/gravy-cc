import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDisputesPage() {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    redirect("/admin-login");
  }

  const disputes = await db.dispute.findMany({
    orderBy: { createdAt: "desc" },
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: "bg-red-900/50 text-red-400 border-red-800",
      UNDER_REVIEW: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
      RESOLVED: "bg-green-900/50 text-green-400 border-green-800",
      CLOSED: "bg-gray-700/50 text-gray-400 border-gray-600",
    };
    return colors[status] || "bg-gray-700/50 text-gray-400 border-gray-600";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Disputes</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">ID</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Reason</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Campaign</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Raised By</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  <Link href={`/admin/disputes/${dispute.id}`} className="text-purple-400 hover:text-purple-300 font-mono text-sm">
                    #{dispute.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-6 py-4 text-white">{dispute.reason}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(dispute.status)}`}>
                    {dispute.status.replace("_", " ")}
                  </span>
                </td>
            <td className="px-6 py-4 text-gray-300">{"-"}</td>
            <td className="px-6 py-4 text-gray-300">{dispute.raisedById || "-"}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {disputes.length === 0 && (
          <p className="text-gray-500 text-center py-8">No disputes found.</p>
        )}
      </div>
    </div>
  );
}
