"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  deadline: string;
  campaign: { title: string; budget: number };
  creator: { name: string; email: string };
  proposal: { coverLetter: string; proposedBudget: number | null } | null;
  escrow: { amountKobo: number; platformFeeKobo: number; status: string; paystackRef: string | null } | null;
  deliverables: Array<{
    id: string;
    cloudinaryUrl: string;
    fileType: string;
    description: string;
    createdAt: string;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Awaiting Payment", color: "bg-yellow-100 text-yellow-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  DELIVERED: { label: "Delivered ", color: "bg-purple-100 text-purple-800" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
  PAID: { label: "Paid ", color: "bg-green-100 text-green-800" },
  REVISION_REQUESTED: { label: "Revision Requested", color: "bg-orange-100 text-orange-800" },
  DISPUTED: { label: "Disputed", color: "bg-red-100 text-red-800" },
};

export default function BrandJobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const justPaid = searchParams.get("paid") === "1";

  useEffect(() => {
    fetchJob();
  }, []);

  async function fetchJob() {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      const data = await res.json();
      setJob(data.job);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!confirm("Approve this delivery and release payment to the creator?")) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/jobs/${params.id}/approve`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed to approve"); return; }
      await fetchJob();
    } catch (e) {
      alert("Network error");
    } finally {
      setApproving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
    </div>
  );

  if (!job) return <div className="p-8 text-center text-gray-500">Job not found.</div>;

  const statusInfo = STATUS_LABELS[job.status] ?? { label: job.status, color: "bg-gray-100 text-gray-600" };
  const amountNGN = (job.escrow?.amountKobo ?? 0) / 100;
  const feeNGN = (job.escrow?.platformFeeKobo ?? 0) / 100;
  const creatorPayout = amountNGN - feeNGN;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {justPaid && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium">
           Payment successful! The creator has been notified and work is now in progress.
        </div>
      )}

      <div className="mb-6">
        <Link href="/brand" className="text-sm text-gray-500 hover:text-gray-700"> Back to Dashboard</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{job.campaign.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">Creator: {job.creator.name ?? job.creator.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Escrow Amount</p>
          <p className="text-2xl font-bold text-gray-900">{amountNGN.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Platform fee: {feeNGN.toLocaleString()} (10%)</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Creator Payout</p>
          <p className="text-2xl font-bold text-green-600">{creatorPayout.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Released on approval</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deadline</p>
          <p className="text-lg font-bold text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
          <p className="text-xs text-gray-400 mt-1">Escrow: {job.escrow?.status}</p>
        </div>
      </div>

      {/* Deliverables */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Deliverables {job.deliverables.length > 0 && `(${job.deliverables.length})`}
        </h2>

        {job.deliverables.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2"></p>
            <p>Waiting for creator to submit work...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {job.deliverables.map((d) => (
              <div key={d.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">{d.fileType === "video" ? "" : ""}</div>
                <div className="flex-1">
                  {d.description && <p className="text-sm text-gray-700 mb-2">{d.description}</p>}
                  <a
                    href={d.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {d.cloudinaryUrl}
                  </a>
                  <p className="text-xs text-gray-400 mt-1">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve button */}
      {job.status === "DELIVERED" && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Approve & Release Payment</h2>
          <p className="text-sm text-gray-500 mb-4">
            Once you approve, {creatorPayout.toLocaleString()} will be released to the creator's wallet instantly. This cannot be undone.
          </p>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-6 py-3 bg-[#D4A843] hover:bg-[#b8922e] text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {approving ? "Releasing payment..." : " Approve & Release " + creatorPayout.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}
