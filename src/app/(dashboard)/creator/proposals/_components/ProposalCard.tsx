"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, Calendar, DollarSign, Star } from "lucide-react";

type Proposal = {
  id: string;
  status: string;
  coverLetter: string;
  proposedBudget: number | null;
  aiScore: number | null;
  aiFeedback: string | null;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    description: string | null;
    budgetKobo: number;
    brand: {
      industry: string | null;
      user: { name: string | null };
    };
  };
};

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:       { label: "Submitted",     color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-700/40" },
  UNDER_AI_REVIEW: { label: "Under Review",  color: "text-orange-400", bg: "bg-orange-900/20", border: "border-orange-700/40" },
  QUALIFIED:       { label: "Qualified",     color: "text-blue-400",   bg: "bg-blue-900/20",   border: "border-blue-700/40"   },
  NOT_QUALIFIED:   { label: "Not Qualified", color: "text-red-400",    bg: "bg-red-900/20",    border: "border-red-700/40"    },
  SHORTLISTED:     { label: "Shortlisted",   color: "text-violet-400", bg: "bg-violet-900/20", border: "border-violet-700/40" },
  SELECTED:        { label: "Selected",      color: "text-green-400",  bg: "bg-green-900/20",  border: "border-green-700/40"  },
  REJECTED:        { label: "Rejected",      color: "text-red-400",    bg: "bg-red-900/20",    border: "border-red-700/40"    },
  WITHDRAWN:       { label: "Withdrawn",     color: "text-gray-400",   bg: "bg-gray-800",      border: "border-gray-700"      },
};

export default function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = statusConfig[proposal.status] ?? statusConfig.SUBMITTED;
  const submittedDate = new Date(proposal.createdAt).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
  const campaignBudget = `${(proposal.campaign.budgetKobo / 100).toLocaleString()}`;
  const proposedRate = proposal.proposedBudget
    ? `${proposal.proposedBudget.toLocaleString()}`
    : null;

  function handleCopy() {
    navigator.clipboard.writeText(proposal.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${expanded ? "border-violet-700/50" : "border-gray-800 hover:border-gray-700"}`}>
      {/* Top bar  status accent */}
      {proposal.status === "ACCEPTED" && (
        <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
      )}
      {(proposal.status === "REJECTED" || proposal.status === "NOT_QUALIFIED") && (
        <div className="h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
      )}
      {proposal.status === "PENDING" && (
        <div className="h-0.5 bg-gradient-to-r from-yellow-500 to-amber-400" />
      )}

      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-semibold text-base truncate">{proposal.campaign.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color} ${status.bg} ${status.border}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {proposal.campaign.brand.user.name ?? "Unknown Brand"}
              {proposal.campaign.brand.industry && (
                <span className="text-gray-600">  {proposal.campaign.brand.industry}</span>
              )}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                Submitted {submittedDate}
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                <DollarSign className="w-3.5 h-3.5" />
                Campaign budget: <span className="text-gray-300 ml-0.5">{campaignBudget}</span>
              </span>
              {proposedRate && (
                <span className="flex items-center gap-1.5 text-violet-400 text-xs font-medium">
                  Your rate: {proposedRate}
                </span>
              )}
              {proposal.aiScore != null && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Star className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-violet-300 font-medium">AI Score: {proposal.aiScore}/100</span>
                </span>
              )}
            </div>
          </div>

          {/* Right  expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0 mt-0.5 px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Hide</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> View pitch</>
            )}
          </button>
        </div>
      </div>

      {/* Expandable section */}
      {expanded && (
        <div className="border-t border-gray-800 px-5 pb-5 pt-4 space-y-4">
          {/* Pitch / Cover letter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-widest">Your Pitch</h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-300 transition-colors px-2.5 py-1 rounded-lg border border-gray-700 hover:border-violet-600"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy to reuse</>
                )}
              </button>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{proposal.coverLetter}</p>
            </div>
          </div>

          {/* AI Feedback */}
          {proposal.aiFeedback && (
            <div>
              <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-2">AI Feedback</h4>
              <div className={`rounded-xl p-4 border ${
                proposal.status === "ACCEPTED"
                  ? "bg-green-900/10 border-green-700/30"
                  : proposal.status === "REJECTED"
                  ? "bg-red-900/10 border-red-700/30"
                  : "bg-violet-900/10 border-violet-700/30"
              }`}>
                <p className="text-gray-300 text-sm leading-relaxed">{proposal.aiFeedback}</p>
              </div>
            </div>
          )}

          {/* Campaign brief link */}
          <div className="flex items-center justify-between pt-1">
            <Link
              href={`/creator/briefs/${proposal.campaign.id}`}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View campaign brief
            </Link>
            {(proposal.status === "REJECTED" || proposal.status === "NOT_QUALIFIED") && (
              <p className="text-xs text-gray-500 italic">Use your pitch above as a starting point for your next application</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
