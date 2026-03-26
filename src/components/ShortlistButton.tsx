"use client";
import { useState } from "react";
export default function ShortlistButton({ creatorId, initialShortlisted = false }: { creatorId: string; initialShortlisted?: boolean }) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted);
  const [loading, setLoading] = useState(false);
  const toggleShortlist = async () => {
    setLoading(true);
    try {
      if (shortlisted) {
        await fetch("/api/shortlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creatorId }) });
        setShortlisted(false);
      } else {
        const res = await fetch("/api/shortlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creatorId }) });
        if (res.ok || res.status === 409) setShortlisted(true);
      }
    } catch (error) { console.error("Failed to update shortlist:", error); }
    finally { setLoading(false); }
  };
  return (
    <button onClick={toggleShortlist} disabled={loading} className={"px-3 py-1 rounded text-sm font-medium transition-colors " + (shortlisted ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200") + (loading ? " opacity-50 cursor-not-allowed" : "")} title={shortlisted ? "Remove from saved" : "Save creator"}>
      {loading ? "..." : shortlisted ? " Saved" : " Save"}
    </button>
  );
}
