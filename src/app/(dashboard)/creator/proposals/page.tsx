import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import ProposalCard from "./_components/ProposalCard";

export default async function CreatorProposalsPage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const creator = await db.creatorProfile.findFirst({
    where: { user: { email: session.user.email } },
  });

  if (!creator) {
    return (
      <div className="p-8 text-gray-400">
        No creator profile found.{" "}
        <Link href="/creator/profile" className="text-violet-400 underline">
          Set up your profile
        </Link>
      </div>
    );
  }

  const proposals = await db.proposal.findMany({
    where: { creatorId: creator.id },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        include: {
          brand: {
            include: { user: true },
          },
        },
      },
    },
  });

  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter((p) => p.status === "SELECTED").length;
  const pendingProposals = proposals.filter((p) => ["SUBMITTED","UNDER_AI_REVIEW","QUALIFIED","SHORTLISTED"].includes(p.status)).length;
  const rejectedProposals = proposals.filter((p) => ["REJECTED","NOT_QUALIFIED"].includes(p.status)).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Proposals</h1>
        <p className="text-gray-400 mt-1">Track your campaign applications and review what you submitted</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total", value: totalProposals, color: "text-white" },
          { label: "Pending", value: pendingProposals, color: "text-yellow-400" },
          { label: "Accepted", value: acceptedProposals, color: "text-green-400" },
          { label: "Rejected", value: rejectedProposals, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Proposal list */}
      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p as any} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No proposals yet</p>
          <p className="text-gray-500 text-sm mb-4">Browse campaigns and submit your first application</p>
          <Link
            href="/creator/briefs"
            className="inline-block px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Browse Campaigns 
          </Link>
        </div>
      )}
    </div>
  );
}
