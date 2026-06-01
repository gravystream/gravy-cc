"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";

interface LinkClick {
  id: string;
  ipHash: string;
  userAgent?: string;
  country?: string;
  city?: string;
  device?: string;
  os?: string;
  browser?: string;
  referrer?: string;
  timestamp: string;
}

interface Conversion {
  id: string;
  type: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface TrackingLinkDetail {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  expiresAt: string | null;
  maxClicks?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  qrCodeUrl?: string;
  createdAt: string;
  clicks: LinkClick[];
  conversions: Conversion[];
  breakdowns: {
    device: Record<string, number>;
    browser: Record<string, number>;
    country: Record<string, number>;
    os: Record<string, number>;
  };
}

export default function AdminTrackingLinkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.id as string;

  const [link, setLink] = useState<TrackingLinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    expiresAt: "",
    maxClicks: "",
  });

  useEffect(() => {
    fetchLinkDetails();
  }, [linkId]);

  const fetchLinkDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/tracking-links/${linkId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch link details");
      }
      const data = await res.json();
      setLink(data);
      setEditData({
        expiresAt: data.expiresAt ? data.expiresAt.split("T")[0] : "",
        maxClicks: data.maxClicks ? data.maxClicks.toString() : "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch link details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!link) return;
    try {
      setToggling(true);
      const res = await fetch(`/api/admin/tracking-links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      setLink({ ...link, isActive: !link.isActive });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const handleUpdateExpiry = async () => {
    if (!link) return;
    try {
      setToggling(true);
      const payload: Record<string, unknown> = {};
      if (editData.expiresAt) payload.expiresAt = new Date(editData.expiresAt);
      if (editData.maxClicks)
        payload.maxClicks = parseInt(editData.maxClicks, 10);

      const res = await fetch(`/api/admin/tracking-links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to update link");
      }
      const updatedLink = await res.json();
      setLink(updatedLink);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this tracking link?")) {
      return;
    }
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/tracking-links/${linkId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete link");
      }
      router.push("/admin/tracking-links");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete link");
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading link details...</p>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-gray-400">Link not found</p>
        </div>
      </div>
    );
  }

  const isExpired =
    link.expiresAt && new Date(link.expiresAt) < new Date();

  return (
    <div className="space-y-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Link Details</h1>
        <div className="w-20"></div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Status Badge & Actions */}
      <div className="flex items-center gap-4">
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            isExpired
              ? "bg-red-100 text-red-800"
              : link.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {isExpired ? "Expired" : link.isActive ? "Active" : "Inactive"}
        </span>
        <button
          onClick={handleToggleStatus}
          disabled={toggling || isExpired}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {link.isActive ? (
            <ToggleRight size={20} />
          ) : (
            <ToggleLeft size={20} />
          )}
          {link.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => handleDelete()}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Trash2 size={20} />
          Delete
        </button>
      </div>

      {/* Link Details Card */}
      <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white mb-4">Link Details</h2>

        <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-400 text-sm font-medium">
              Short Code
            </label>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 bg-gray-800 text-white px-4 py-2 rounded font-mono">
                {link.shortCode}
              </code>
              <button
                onClick={() => copyToClipboard(link.shortCode)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium">
              Destination URL
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={link.destinationUrl}
                readOnly
                className="flex-1 bg-gray-800 text-gray-300 px-4 py-2 rounded font-mono text-sm truncate"
              />
              <button
                onClick={() => copyToClipboard(link.destinationUrl)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          {link.utmSource && (
            <div>
              <label className="text-gray-400 text-sm font-medium">
                UTM Source
              </label>
              <p className="text-white mt-2">{link.utmSource}</p>
            </div>
          )}

          {link.utmMedium && (
            <div>
              <label className="text-gray-400 text-sm font-medium">
                UTM Medium
              </label>
              <p className="text-white mt-2">{link.utmMedium}</p>
            </div>
          )}

          {link.utmCampaign && (
            <div>
              <label className="text-gray-400 text-sm font-medium">
                UTM Campaign
              </label>
              <p className="text-white mt-2">{link.utmCampaign}</p>
            </div>
          )}

          {link.utmContent && (
            <div>
              <label className="text-gray-400 text-sm font-medium">
                UTM Content
              </label>
              <p className="text-white mt-2">{link.utmContent}</p>
            </div>
          )}
        </div>
      </div>

      {/* Expiry & Limits */}
      <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Expiry & Limits</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm font-medium">
                Expires At
              </label>
              <input
                type="date"
                value={editData.expiresAt}
                onChange={(e) =>
                  setEditData({ ...editData, expiresAt: e.target.value })
                }
                className="w-full mt-2 bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium">
                Max Clicks
              </label>
              <input
                type="number"
                value={editData.maxClicks}
                onChange={(e) =>
                  setEditData({ ...editData, maxClicks: e.target.value })
                }
                className="w-full mt-2 bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleUpdateExpiry}
              disabled={toggling}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm font-medium">
                Expires At
              </label>
              <p className="text-white mt-2">
                {link.expiresAt
                  ? new Date(link.expiresAt).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium">
                Max Clicks
              </label>
              <p className="text-white mt-2">{link.maxClicks || "Unlimited"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Click Statistics */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Total Clicks</p>
          <p className="text-3xl font-bold text-white mt-2">
            {link.totalClicks.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Unique Clicks</p>
          <p className="text-3xl font-bold text-white mt-2">
            {link.uniqueClicks.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Conversions</p>
          <p className="text-3xl font-bold text-white mt-2">
            {link.conversions.length}
          </p>
        </div>
      </div>

      {/* Device/Browser/Country Breakdown */}
      <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Device Breakdown
          </h3>
          {Object.keys(link.breakdowns.device).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(link.breakdowns.device).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-gray-300">{device || "Unknown"}</span>
                  <span className="text-white font-semibold">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browser Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Browser Breakdown
          </h3>
          {Object.keys(link.breakdowns.browser).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(link.breakdowns.browser).map(
                ([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <span className="text-gray-300">{browser || "Unknown"}</span>
                    <span className="text-white font-semibold">
                      {count.toLocaleString()}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Country Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Countries
          </h3>
          {Object.keys(link.breakdowns.country).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(link.breakdowns.country)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-gray-300">{country || "Unknown"}</span>
                    <span className="text-white font-semibold">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* OS Breakdown */}
        <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            OS Breakdown
          </h3>
          {Object.keys(link.breakdowns.os).length === 0 ? (
            <p className="text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(link.breakdowns.os).map(([os, count]) => (
                <div key={os} className="flex items-center justify-between">
                  <span className="text-gray-300">{os || "Unknown"}</span>
                  <span className="text-white font-semibold">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Clicks */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Recent Clicks</h3>
        </div>
        {link.clicks.length === 0 ? (
          <div className="p-4 md:p-8 text-center text-gray-400">No clicks yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Country
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Device
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Browser
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {link.clicks.slice(0, 20).map((click) => (
                  <tr
                    key={click.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {click.country || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {click.device || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {click.browser || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversions */}
      {link.conversions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Conversions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Type
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Value
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {link.conversions.map((conversion) => (
                  <tr
                    key={conversion.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {conversion.type}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {conversion.value
                        ? `$${conversion.value.toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(conversion.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
