"use client";

import { useState, useEffect } from "react";
import {
  Shuffle, Plus, Trash2, BarChart3, ToggleLeft, ToggleRight,
  ArrowUpRight, ExternalLink, Percent,
} from "lucide-react";

interface Variant {
  id: string;
  trackingLinkId: string;
  label: string;
  destinationUrl: string;
  weight: number;
  totalClicks: number;
  uniqueClicks: number;
  conversions: number;
  isActive: boolean;
  createdAt: string;
}

interface TrackingLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  totalClicks: number;
  campaign?: { title: string };
}

function VariantCard({
  variant,
  total,
  onToggle,
  onDelete,
}: {
  variant: Variant;
  total: number;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const clickShare = total > 0 ? ((variant.totalClicks / total) * 100).toFixed(1) : "0.0";
  const convRate =
    variant.totalClicks > 0
      ? ((variant.conversions / variant.totalClicks) * 100).toFixed(1)
      : "0.0";

  return (
    <div className={`bg-gray-800/50 border rounded-lg p-4 ${variant.isActive ? "border-violet-500/50" : "border-gray-700/30 opacity-60"}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 bg-violet-900/30 text-violet-400 text-xs rounded-full font-medium">
            {variant.label}
          </span>
          <span className="text-xs text-gray-500">Weight: {variant.weight}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
            {variant.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-300 truncate mb-3 font-mono">{variant.destinationUrl}</p>
      <div className="grid stagger-children grid-cols-1 md:grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold">{variant.totalClicks}</p>
          <p className="text-xs text-gray-500">Clicks</p>
        </div>
        <div>
          <p className="text-lg font-bold text-violet-400">{clickShare}%</p>
          <p className="text-xs text-gray-500">Traffic Share</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-400">{convRate}%</p>
          <p className="text-xs text-gray-500">Conv. Rate</p>
        </div>
      </div>
    </div>
  );
}

export default function ABVariantsPage() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<string>("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newWeight, setNewWeight] = useState(50);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const res = await fetch("/api/creator/tracking-links");
        if (res.ok) {
          const data = await res.json();
          setLinks(data.links || []);
          if (data.links?.length > 0) setSelectedLink(data.links[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, []);

  useEffect(() => {
    if (!selectedLink) return;
    async function fetchVariants() {
      try {
        const res = await fetch(`/api/creator/ab-variants?linkId=${selectedLink}`);
        if (res.ok) {
          const data = await res.json();
          setVariants(data.variants || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchVariants();
  }, [selectedLink]);

  async function createVariant() {
    if (!newLabel || !newUrl) return;
    setCreating(true);
    try {
      const res = await fetch("/api/creator/ab-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: selectedLink, label: newLabel, destinationUrl: newUrl, weight: newWeight }),
      });
      if (res.ok) {
        const data = await res.json();
        setVariants((v) => [...v, data.variant]);
        setShowCreate(false);
        setNewLabel("");
        setNewUrl("");
        setNewWeight(50);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function toggleVariant(variantId: string, isActive: boolean) {
    try {
      await fetch("/api/creator/ab-variants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, isActive: !isActive }),
      });
      setVariants((v) => v.map((x) => (x.id === variantId ? { ...x, isActive: !isActive } : x)));
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteVariant(variantId: string) {
    try {
      await fetch(`/api/creator/ab-variants?variantId=${variantId}`, { method: "DELETE" });
      setVariants((v) => v.filter((x) => x.id !== variantId));
    } catch (err) {
      console.error(err);
    }
  }

  const totalVariantClicks = variants.reduce((s, v) => s + v.totalClicks, 0);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-48 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
          <Shuffle className="w-6 h-6 text-violet-400" /> A/B Link Variants
        </h1>
        <p className="text-gray-400 mt-1">
          Test different destination URLs to optimize your conversion rates
        </p>
      </div>

      {/* Link Selector */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
        <label className="text-sm text-gray-400 block mb-2">Select Tracking Link</label>
        <select
          value={selectedLink}
          onChange={(e) => setSelectedLink(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
        >
          {links.map((link) => (
            <option key={link.id} value={link.id}>
              /go/{link.shortCode} — {link.campaign?.title || link.destinationUrl}
            </option>
          ))}
        </select>
      </div>

      {/* Variants Grid */}
      {variants.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 md:p-8 text-center">
          <Shuffle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">No variants yet for this link</p>
          <p className="text-gray-500 text-sm mb-4">
            Create A/B variants to test different destinations and optimize conversions
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Create First Variant
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-400">{variants.length} variant(s) — {totalVariantClicks} total clicks</p>
            {variants.length < 5 && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Add Variant
              </button>
            )}
          </div>
          <div className="grid stagger-children grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((v) => (
              <VariantCard
                key={v.id}
                variant={v}
                total={totalVariantClicks}
                onToggle={() => toggleVariant(v.id, v.isActive)}
                onDelete={() => deleteVariant(v.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 card-hover border border-gray-700 rounded-xl p-4 md:p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create A/B Variant</h2>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Label</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Variant B"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Destination URL</label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/landing-v2"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Traffic Weight ({newWeight}%)</label>
              <input
                type="range"
                min={10}
                max={90}
                value={newWeight}
                onChange={(e) => setNewWeight(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={createVariant}
                disabled={creating || !newLabel || !newUrl}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Variant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
