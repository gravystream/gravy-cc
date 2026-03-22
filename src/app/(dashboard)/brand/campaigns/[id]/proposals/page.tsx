"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Proposal {
  id: string;
  status: string;
  creatorId: string | null;
  coverLetter: string;
  proposedBudget: number | null;
  aiScore: number | null;
  aiFeedback: string | null;
  createdAt: string;
  creatorProfile: {
    displayName: string;
    bio: string;
    niche: string[];
    followerCount: number;
    avgEngagementRate: number;
  };
}

export default function CampaignProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  const handleStartChat = async (creatorId: string) => {
    setStartingChatId(creatorId);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, campaignId: params.id }),
      });
      if (!res.ok) throw new Error('Failed to start conversation');
      const data = await res.json();
      router.push(`/brand/messages/${data.conversationId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChatId(null);
    }
  };
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<{ title: string; budget: number } | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    try {
      const res = await fetch(`/api/campaigns/${params.id}/proposals`);
      const data = await res.json();
      setProposals(data.proposals ?? []);
      setCampaign(data.campaign ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(proposalId: string, action: "accept" | "reject") {
    setActionLoading(proposalId + action);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Something went wrong");
        return;
      }

      if (action === "accept" && data.paymentUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.paymentUrl;
      } else {
        await fetchProposals();
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/brand" className="text-sm text-gray-500 hover:text-gray-700"> Back to Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Proposals for {campaign?.title ?? "Campaign"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Budget: {(campaign?.budget ?? 0).toLocaleString()} &bull; {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3"></p>
          <p>No proposals yet. Share your campaign to attract creators!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-semibold text-gray-900 text-lg">
                      {p.creatorProfile?.displayName ?? "Creator"}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                    {p.aiScore !== null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        AI Score: {p.aiScore}/100
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    <span> {p.creatorProfile?.niche?.join(", ")}</span>
                    <span> {(p.creatorProfile?.followerCount ?? 0).toLocaleString()} followers</span>
                    <span> {p.creatorProfile?.avgEngagementRate?.toFixed(1)}% engagement</span>
                    {p.proposedBudget && <span className="text-green-700 font-medium">{p.proposedBudget.toLocaleString()} proposed</span>}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{p.coverLetter}</p>

                  {p.aiFeedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                      <span className="font-semibold">AI Insight: </span>{p.aiFeedback}
                    </div>
                  )}
                </div>

                {["SUBMITTED","UNDER_AI_REVIEW","QUALIFIED","SHORTLISTED"].includes(p.status) && (
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <button
                      onClick={() => handleAction(p.id, "accept")}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-[#D4A843] hover:bg-[#b8922e] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      {actionLoading === p.id + "accept" ? "Processing..." : " Accept & Pay"}
                    </button>
                    <button
                      onClick={() => handleAction(p.id, "reject")}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      {actionLoading === p.id + "reject" ? "..." : " Reject"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
