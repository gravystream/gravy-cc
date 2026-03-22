"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  deadline: string;
  campaign: { title: string };
  escrow: { amountKobo: number; platformFeeKobo: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-purple-100 text-purple-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  APPROVED: "bg-green-100 text-green-800",
  DISPUTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function CreatorJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs/my")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Jobs</h1>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3"></p>
          <p className="text-lg">No jobs yet. Apply to campaigns to get started!</p>
          <Link href="/campaigns" className="mt-4 inline-block px-5 py-2.5 bg-[#D4A843] text-white rounded-lg font-medium text-sm">
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const myPayout = ((job.escrow?.amountKobo ?? 0) - (job.escrow?.platformFeeKobo ?? 0)) / 100;
            return (
              <Link key={job.id} href={`/creator/jobs/${job.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-yellow-400 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{job.campaign.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Deadline: {new Date(job.deadline).toLocaleDateString()} &bull; Payout: <span className="text-green-600 font-medium">{myPayout.toLocaleString()}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {job.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
