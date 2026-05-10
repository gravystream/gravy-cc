"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Eye, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import ClickHeatmap from "@/components/tracking/ClickHeatmap";

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    brand: {
      id: string;
      companyName: string | null;
      user: {
        name: string;
      };
    };
  };
  creator: {
    id: string;
    name: string;
  };
  conversions: Array<{
    id: string;
    value?: number;
  }>;
}

interface SummaryCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

export default function AdminTrackingLinksPage() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/tracking-links");
      if (!res.ok) {
        throw new Error("Failed to fetch tracking links");
      }
      const data = await res.json();
      setLinks(data.links);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while fetching links"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setToggling(id);
      const res = await fetch(`/api/admin/tracking-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update link status");
      }
      setLinks((prev) =>
        prev.map((link) =>
          link.id === id ? { ...link, isActive: !currentStatus } : link
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update link status"
      );
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tracking link?")) {
      return;
    }
    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/tracking-links/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete link");
      }
      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete link");
    } finally {
      setDeleting(null);
    }
  };

  const totalClicks = links.reduce((sum, link) => sum + link.totalClicks, 0);
  const totalConversions = links.reduce(
    (sum, link) => sum + link.conversions.length,
    0
  );
  const totalRevenue = links.reduce(
    (sum, link) =>
      sum + link.conversions.reduce((s, c) => s + (c.value || 0), 0),
    0
  );

  const summaryCards: SummaryCard[] = [
    { label: "Total Links", value: links.length, icon: "ð" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: "ð" },
    {
      label: "Total Conversions",
      value: totalConversions.toLocaleString(),
      icon: "â",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: "ð°",
    },
  ];

  const isExpired = (link: TrackingLink) => {
    if (!link.expiresAt) return false;
    return new Date(link.expiresAt) < new Date();
  };

  const getStatusColor = (link: TrackingLink) => {
    if (isExpired(link)) return "bg-red-100 text-red-800";
    return link.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (link: TrackingLink) => {
    if (isExpired(link)) return "Expired";
    return link.isActive ? "Active" : "Inactive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tracking links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-purple-500" />
          Tracking Links
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {card.value}
                </p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {links.length === 0 ? (
          <div className="p-4 md:p-8 text-center">
            <p className="text-gray-400">No tracking links found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2"><table className="w-full min-w-full max-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Link Name
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Short Code
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Brand
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Creator
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Clicks
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Unique
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Conversions
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Status
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Created
                </th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-white text-sm truncate max-w-xs">
                    {link.campaign.title}
                  </td>
                  <td className="px-6 py-4 text-white text-sm font-mono">
                    {link.shortCode}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {link.campaign.brand.companyName || link.campaign.brand.user.name}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {link.creator.name}
                  </td>
                  <td className="px-6 py-4 text-white text-sm font-semibold">
                    {link.totalClicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-white text-sm">
                    {link.uniqueClicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-white text-sm">
                    {link.conversions.length}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        link
                      )}`}
                    >
                      {getStatusLabel(link)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/tracking-links/${link.id}`}>
                        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
                          <Eye size={18} />
                        </button>
                      </Link>
                      <button
                        onClick={() =>
                          handleToggleStatus(link.id, link.isActive)
                        }
                        disabled={toggling === link.id || isExpired(link)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {link.isActive ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deleting === link.id}
                        className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      
      {/* Activity Heatmap */}
      <div className="mt-8">
        <ClickHeatmap days={30} />
      </div>
    </div>
    </div>
  );
}
