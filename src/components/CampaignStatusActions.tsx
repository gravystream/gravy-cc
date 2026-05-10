"use client";
import { useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-900/30 text-green-400",
  DRAFT: "bg-gray-800 text-gray-400",
  REVIEWING: "bg-yellow-900/30 text-yellow-400",
  IN_PROGRESS: "bg-blue-900/30 text-blue-400",
  COMPLETED: "bg-violet-900/30 text-violet-400",
  CANCELLED: "bg-red-900/30 text-red-400",
};

export default function CampaignStatusActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const [busy, setBusy] = useState(false);
  const upper = status.toUpperCase();
  const isActive = upper === "ACTIVE";
  const colorClass = STATUS_COLORS[upper] || STATUS_COLORS.DRAFT;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = isActive ? "DRAFT" : "ACTIVE";
    try {
      const r = await fetch(`/api/brand/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (r.ok) {
        window.location.reload();
      } else {
        const err = await r.json().catch(() => ({} as { error?: string }));
        alert(`Status update failed: ${err.error || r.statusText}`);
        setBusy(false);
      }
    } catch (e: any) {
      alert(`Status update failed: ${e.message}`);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${colorClass}`}>
        {status}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 transition font-medium"
        >
          {busy ? "..." : isActive ? "Pause" : "Publish"}
        </button>
        <Link
          href={`/brand/campaigns/${campaignId}/edit`}
          className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
