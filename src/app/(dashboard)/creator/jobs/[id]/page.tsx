"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  deadline: string;
  campaign: { title: string; budget: number; userId: string };
  escrow: { amountKobo: number; platformFeeKobo: number; status: string } | null;
  proposal: { coverLetter: string; proposedBudget: number | null } | null;
  deliverables: Array<{
    id: string;
    cloudinaryUrl: string;
    fileType: string;
    description: string;
    createdAt: string;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  AWAITING_PAYMENT: { label: "Awaiting Payment", color: "bg-yellow-100 text-yellow-800", desc: "The brand needs to complete payment before work begins." },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800", desc: "You can now submit your deliverable below." },
  DELIVERED: { label: "Delivered", color: "bg-purple-100 text-purple-800", desc: "Your work has been submitted. Waiting for brand approval." },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800", desc: "The brand approved your work!" },
  PAID: { label: "Paid ", color: "bg-green-100 text-green-800", desc: "Payment has been released to your wallet." },
  REVISION_REQUESTED: { label: "Revision Requested", color: "bg-orange-100 text-orange-800", desc: "The brand has requested revisions. Please re-submit." },
};

export default function CreatorJobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchJob(); }, []);

  async function fetchJob() {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      const data = await res.json();
      setJob(data.job);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) { alert("Please enter a URL"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${params.id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), description: description.trim(), fileType: "video" }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed to submit"); return; }
      setUrl(""); setDescription("");
      await fetchJob();
    } catch (e) { alert("Network error"); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
    </div>
  );

  if (!job) return <div className="p-8 text-center text-gray-500">Job not found.</div>;

  const statusInfo = STATUS_LABELS[job.status] ?? { label: job.status, color: "bg-gray-100 text-gray-600", desc: "" };
  const amountNGN = (job.escrow?.amountKobo ?? 0) / 100;
  const feeNGN = (job.escrow?.platformFeeKobo ?? 0) / 100;
  const myPayout = amountNGN - feeNGN;
  const canSubmit = ["IN_PROGRESS", "REVISION_REQUESTED"].includes(job.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/creator/jobs" className="text-sm text-gray-500 hover:text-gray-700"> Back to My Jobs</Link>

      <div className="flex items-center gap-3 mt-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{job.campaign.title}</h1>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      {statusInfo.desc && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl text-blue-800 text-sm">{statusInfo.desc}</div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Your Payout</p>
          <p className="text-2xl font-bold text-green-600">{myPayout.toLocaleString()}</p>
          <p className="text-xs text-gray-400">After 10% platform fee</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deadline</p>
          <p className="text-xl font-bold text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Submit deliverable */}
      {canSubmit && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Work</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content URL *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://youtube.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Upload to Google Drive, Dropbox, or YouTube and paste the link here.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what you created..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#D4A843] hover:bg-[#b8922e] text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Deliverable"}
            </button>
          </form>
        </div>
      )}

      {/* Previous deliverables */}
      {job.deliverables.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Work</h2>
          <div className="space-y-3">
            {job.deliverables.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{d.fileType === "video" ? "" : ""}</span>
                <div className="flex-1">
                  {d.description && <p className="text-sm text-gray-700 mb-1">{d.description}</p>}
                  <a href={d.cloudinaryUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all">
                    {d.cloudinaryUrl}
                  </a>
                  <p className="text-xs text-gray-400 mt-1">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
