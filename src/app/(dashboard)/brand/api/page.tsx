"use client";

import { useState, useEffect } from "react";
import {
  Key, Plus, Trash2, Copy, Check, Clock, Shield, Code,
  ExternalLink, Eye, EyeOff, AlertTriangle,
} from "lucide-react";

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

function ApiKeyCard({
  apiKey,
  onRevoke,
}: {
  apiKey: ApiKeyData;
  onRevoke: () => void;
}) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

  return (
    <div className={`bg-gray-800/50 border rounded-lg p-4 ${apiKey.isActive && !isExpired ? "border-gray-700/50" : "border-red-800/30 opacity-60"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-violet-400" />
          <h3 className="font-medium text-sm">{apiKey.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {!apiKey.isActive && (
            <span className="text-xs text-red-400 px-2 py-0.5 bg-red-900/20 rounded-full">Revoked</span>
          )}
          {isExpired && (
            <span className="text-xs text-orange-400 px-2 py-0.5 bg-orange-900/20 rounded-full">Expired</span>
          )}
          {apiKey.isActive && !isExpired && (
            <button onClick={onRevoke} className="text-gray-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Revoke
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Key:</span>
          <code className="text-gray-400 bg-gray-900/50 px-2 py-0.5 rounded text-xs">
            {apiKey.keyPrefix}...
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Scopes:</span>
          <div className="flex gap-1">
            {apiKey.scopes.map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">{s}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
          {apiKey.lastUsedAt && <span>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>}
          {apiKey.expiresAt && <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

export default function BrandApiPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [expiry, setExpiry] = useState("90");
  const [creating, setCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/brand/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function createKey() {
    if (!newName) return;
    setCreating(true);
    try {
      const res = await fetch("/api/brand/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          expiresInDays: expiry ? parseInt(expiry) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewRawKey(data.rawKey);
        setKeys((prev) => [data.key, ...prev]);
        setNewName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId: string) {
    try {
      await fetch(`/api/brand/api-keys?keyId=${keyId}`, { method: "DELETE" });
      setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
    } catch (err) {
      console.error(err);
    }
  }

  function copyKey() {
    if (newRawKey) {
      navigator.clipboard.writeText(newRawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-32 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-violet-400" /> Brand API
          </h1>
          <p className="text-gray-400 mt-1">Manage API keys for external integrations</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setNewRawKey(null); }}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Generate Key
        </button>
      </div>

      {/* New Key Display */}
      {newRawKey && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-300">Copy your API key now</p>
              <p className="text-xs text-yellow-400/60 mt-1">This is the only time it will be shown. Store it securely.</p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 bg-gray-900/80 px-3 py-2 rounded-lg text-xs font-mono text-gray-300 break-all">
                  {newRawKey}
                </code>
                <button
                  onClick={copyKey}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Docs Quick Reference */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Code className="w-4 h-4" /> Quick Reference
        </h2>
        <div className="space-y-2 font-mono text-xs">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-500"># Get campaigns</p>
            <p className="text-green-400">GET /api/v1/external?resource=campaigns</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-500"># Get analytics summary</p>
            <p className="text-green-400">GET /api/v1/external?resource=analytics</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-500"># Get tracking links</p>
            <p className="text-green-400">GET /api/v1/external?resource=links</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 mt-2">
            <p className="text-gray-500"># Example curl:</p>
            <p className="text-violet-400">curl -H &quot;Authorization: Bearer nvc_...&quot; \</p>
            <p className="text-violet-400 ml-4">https://desk.novaclio.io/api/v1/external?resource=analytics</p>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div>
        <h2 className="text-sm font-medium text-gray-300 mb-3">
          Your API Keys ({keys.filter((k) => k.isActive).length} active)
        </h2>
        {keys.length === 0 ? (
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4 md:p-8 text-center">
            <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No API keys yet</p>
            <p className="text-gray-500 text-sm mt-1">Generate a key to start using the Novaclio API</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <ApiKeyCard key={k.id} apiKey={k} onRevoke={() => revokeKey(k.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && !newRawKey && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 card-hover border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Generate API Key</h2>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Key Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Production Integration"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Expires In (days)</label>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="">Never</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={creating || !newName}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {creating ? "Generating..." : "Generate Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
