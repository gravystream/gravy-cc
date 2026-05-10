"use client";

import { useEffect, useState } from "react";

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  uniqueClicks: number;
  isActive: boolean;
  expiresAt: string | null;
  maxClicks: number | null;
  createdAt: string;
  campaign: { title: string } | null;
  _count: { conversions: number };
}

interface Campaign {
  id: string;
  title: string;
  status: string;
}

interface AnalyticsResponse {
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    totalRevenue: number;
  };
  links: Array<any>;
  clicksOverTime: Array<{ date: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  countryBreakdown: Array<{ country: string; count: number }>;
}

export default function BrandLinksPageV2() {
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "links">(
    "overview"
  );
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    campaignId: "",
    destinationUrl: "",
    linkType: "website",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    expiresAt: "",
    maxClicks: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<TrackingLink | null>(null);
  const [editData, setEditData] = useState({
    destinationUrl: "",
    expiresAt: "",
    maxClicks: "",
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, linksRes, campaignsRes] = await Promise.all([
        fetch("/api/brand/analytics"),
        fetch("/api/brand/tracking-links"),
        fetch("/api/brand/campaigns"),
      ]);

      if (!analyticsRes.ok || !linksRes.ok || !campaignsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const analyticsData = await analyticsRes.json();
      const linksData = await linksRes.json();
      const campaignsData = await campaignsRes.json();

      setAnalytics(analyticsData);
      setLinks(linksData.links || []);
      setCampaigns(campaignsData.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      setToggling(linkId);
      const res = await fetch("/api/brand/tracking-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId, isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setLinks((prev) =>
        prev.map((link) =>
          link.id === linkId ? { ...link, isActive: !currentStatus } : link
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const handleEditLink = (link: TrackingLink) => {
    setSelectedLink(link);
    setEditData({
      destinationUrl: link.destinationUrl,
      expiresAt: link.expiresAt ? link.expiresAt.split("T")[0] : "",
      maxClicks: link.maxClicks ? link.maxClicks.toString() : "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLink) return;
    try {
      setToggling(selectedLink.id);
      const payload: Record<string, unknown> = { id: selectedLink.id };
      if (editData.destinationUrl) payload.destinationUrl = editData.destinationUrl;
      if (editData.expiresAt) payload.expiresAt = editData.expiresAt;
      else payload.expiresAt = null;
      if (editData.maxClicks) payload.maxClicks = editData.maxClicks;
      else payload.maxClicks = null;

      const res = await fetch("/api/brand/tracking-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update link");
      const data = await res.json();
      setLinks((prev) =>
        prev.map((link) =>
          link.id === selectedLink.id
            ? { ...link, ...data.link }
            : link
        )
      );
      setShowEditModal(false);
      setSelectedLink(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    try {
      setDeleting(linkId);
      const res = await fetch("/api/brand/tracking-links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId }),
      });
      if (!res.ok) throw new Error("Failed to delete link");
      setLinks((prev) => prev.filter((link) => link.id !== linkId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete link");
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    if (links.length === 0) return;
    const headers = [
      "Short Code",
      "Campaign",
      "Destination URL",
      "Total Clicks",
      "Unique Clicks",
      "Conversions",
      "Status",
      "Created",
    ];
    const rows = links.map((link) => [
      link.shortCode,
      link.campaign?.title || "N/A",
      link.destinationUrl,
      link.totalClicks || 0,
      link.uniqueClicks || 0,
      link._count?.conversions || 0,
      link.isActive ? "Active" : "Inactive",
      new Date(link.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brand-links-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
  };

  const fmt = (n: number | undefined | null) => (n ?? 0).toLocaleString();

  
  async function handleCreateLink() {
    if (!createForm.campaignId || !createForm.destinationUrl) {
      setCreateError("Campaign and destination URL are required");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/brand/tracking-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          maxClicks: createForm.maxClicks ? parseInt(createForm.maxClicks) : null,
          expiresAt: createForm.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      setCreateSuccess("Link created: " + data.link.shortCode);
      setShowCreateModal(false);
      setCreateForm({ campaignId: "", destinationUrl: "", linkType: "website", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", expiresAt: "", maxClicks: "" });
      // Refresh links
      const refreshRes = await fetch("/api/brand/tracking-links");
      const refreshData = await refreshRes.json();
      setLinks(refreshData.links || []);
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setCreateLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-bold text-white">Link Management</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Create Link
            </button>
          </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={"px-4 py-2 font-medium transition-colors " + (
            activeTab === "overview"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={"px-4 py-2 font-medium transition-colors " + (
            activeTab === "campaigns"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={"px-4 py-2 font-medium transition-colors " + (
            activeTab === "links"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          )}
        >
          Links
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid stagger-children grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm font-medium">Total Clicks</p>
              <p className="text-3xl font-bold text-white mt-2">
                {fmt(summary?.totalClicks)}
              </p>
            </div>
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm font-medium">Unique Clicks</p>
              <p className="text-3xl font-bold text-white mt-2">
                {fmt(summary?.uniqueClicks)}
              </p>
            </div>
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm font-medium">Conversions</p>
              <p className="text-3xl font-bold text-white mt-2">
                {fmt(summary?.totalConversions)}
              </p>
            </div>
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm font-medium">Revenue</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {"$" + (summary?.totalRevenue ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Clicks Over Time */}
          {analytics?.clicksOverTime && analytics.clicksOverTime.length > 0 && (
            <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Clicks Over Time (Last 7 Days)</h3>
              <div className="flex items-end gap-1 h-40">
                {analytics.clicksOverTime.map((d, i) => {
                  const max = Math.max(...analytics.clicksOverTime.map((x) => x.count), 1);
                  const h = (d.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{d.count}</span>
                      <div
                        className="w-full bg-purple-600 rounded-t"
                        style={{ height: Math.max(h, 4) + "%" }}
                      />
                      <span className="text-xs text-gray-600 truncate w-full text-center">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breakdowns */}
          <div className="grid stagger-children grid-cols-1 md:grid-cols-3 gap-4">
            {analytics?.deviceBreakdown && analytics.deviceBreakdown.length > 0 && (
              <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">Devices</h3>
                {analytics.deviceBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-400">{d.device || "Unknown"}</span>
                    <span className="text-white font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
            {analytics?.browserBreakdown && analytics.browserBreakdown.length > 0 && (
              <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">Browsers</h3>
                {analytics.browserBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-400">{d.browser || "Unknown"}</span>
                    <span className="text-white font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
            {analytics?.countryBreakdown && analytics.countryBreakdown.length > 0 && (
              <div className="bg-gray-900 card-hover/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">Countries</h3>
                {analytics.countryBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-400">{d.country || "Unknown"}</span>
                    <span className="text-white font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="p-4 md:p-8 text-center text-gray-400">No campaigns</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/50">
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                      Campaign
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                      Status
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-white">
                        {campaign.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={"px-3 py-1 rounded-full text-xs font-medium " + (
                          campaign.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-700 text-gray-400"
                        )}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={"/brand/campaigns/" + campaign.id}
                                   className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          View Analytics
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Links Tab */}
      {activeTab === "links" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              All Links ({links.length})
            </h2>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              Export CSV
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {links.length === 0 ? (
              <div className="p-4 md:p-8 text-center text-gray-400">No links yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/50">
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Short Code</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Campaign</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">URL</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Clicks</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Conv.</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr
                        key={link.id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-white font-mono text-sm">
                          {link.shortCode}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {link.campaign?.title || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm truncate max-w-xs">
                          {link.destinationUrl}
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                          {fmt(link.totalClicks)}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {fmt(link._count?.conversions)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={"px-3 py-1 rounded-full text-xs font-medium " + (
                              link.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-700 text-gray-400"
                            )}
                          >
                            {link.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(link.id, link.isActive)}
                              disabled={toggling === link.id}
                              className={"px-2 py-1 rounded text-xs font-medium transition " + (
                                link.isActive
                                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              ) + (toggling === link.id ? " opacity-50" : "")}
                            >
                              {toggling === link.id ? "..." : link.isActive ? "Pause" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleEditLink(link)}
                              className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              disabled={deleting === link.id}
                              className={"px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" + (deleting === link.id ? " opacity-50" : "")}
                            >
                              {deleting === link.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 card-hover rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create Tracking Link</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            {createError && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">{createError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Campaign *</label>
                <select value={createForm.campaignId} onChange={(e) => setCreateForm({...createForm, campaignId: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Select a campaign</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Destination URL *</label>
                <input type="url" value={createForm.destinationUrl} onChange={(e) => setCreateForm({...createForm, destinationUrl: e.target.value})} placeholder="https://example.com/product" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Link Type</label>
                <select value={createForm.linkType} onChange={(e) => setCreateForm({...createForm, linkType: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="website">Website</option>
                  <option value="product">Product Page</option>
                  <option value="landing">Landing Page</option>
                  <option value="affiliate">Affiliate Link</option>
                  <option value="social">Social Media</option>
                  <option value="bio">Bio Link</option>
                  <option value="promo">Promo / Discount</option>
                  <option value="referral">Referral Link</option>
                </select>
              </div>
              <details className="group">
                <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">UTM Parameters (optional)</summary>
                <div className="mt-3 space-y-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Source</label><input type="text" value={createForm.utmSource} onChange={(e) => setCreateForm({...createForm, utmSource: e.target.value})} placeholder="instagram, tiktok" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Medium</label><input type="text" value={createForm.utmMedium} onChange={(e) => setCreateForm({...createForm, utmMedium: e.target.value})} placeholder="social, email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Campaign</label><input type="text" value={createForm.utmCampaign} onChange={(e) => setCreateForm({...createForm, utmCampaign: e.target.value})} placeholder="spring-launch" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Content</label><input type="text" value={createForm.utmContent} onChange={(e) => setCreateForm({...createForm, utmContent: e.target.value})} placeholder="hero-banner" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                </div>
              </details>
              <details className="group">
                <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">Advanced Options (optional)</summary>
                <div className="mt-3 space-y-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Expires At</label><input type="datetime-local" value={createForm.expiresAt} onChange={(e) => setCreateForm({...createForm, expiresAt: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Max Clicks</label><input type="number" value={createForm.maxClicks} onChange={(e) => setCreateForm({...createForm, maxClicks: e.target.value})} placeholder="Unlimited" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                </div>
              </details>
              <button onClick={handleCreateLink} disabled={createLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                {createLoading ? "Creating..." : "Create Tracking Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 card-hover border border-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Edit Link</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                X
              </button>
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium">Destination URL</label>
              <input
                type="url"
                value={editData.destinationUrl}
                onChange={(e) => setEditData({ ...editData, destinationUrl: e.target.value })}
                className="w-full mt-2 bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium">Expires At</label>
              <input
                type="date"
                value={editData.expiresAt}
                onChange={(e) => setEditData({ ...editData, expiresAt: e.target.value })}
                className="w-full mt-2 bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium">Max Clicks</label>
              <input
                type="number"
                value={editData.maxClicks}
                onChange={(e) => setEditData({ ...editData, maxClicks: e.target.value })}
                className="w-full mt-2 bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={toggling !== null}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
