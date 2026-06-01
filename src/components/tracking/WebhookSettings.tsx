"use client";

import { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, Eye, EyeOff, AlertCircle } from "lucide-react";

interface WebhookSettingsProps {
  campaignId: string;
}

export default function WebhookSettings({ campaignId }: WebhookSettingsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<"secret" | "url" | null>(null);

  const webhookUrl = "https://novaclio.io/api/webhooks/conversions";

  useEffect(() => {
    fetchSecret();
  }, [campaignId]);

  const fetchSecret = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/campaigns/" + campaignId + "/webhook-secret"
      );
      if (response.ok) {
        const d = await response.json();
        setData(d);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = async () => {
    try {
      setGenerating(true);
      const response = await fetch(
        "/api/campaigns/" + campaignId + "/webhook-secret",
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to generate webhook secret");
      const d = await response.json();
      setNewSecret(d.webhookSecret);
      setData(d);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: "secret" | "url") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600 dark:text-gray-400">Loading webhook settings...</p>
      </div>
    );
  }

  const secretValue = newSecret || data?.webhookSecret || "";

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Webhook Configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Receive real-time conversion notifications
        </p>

        <div className="space-y-5">
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl, "url")}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {copied === "url" ? (
                  <><Check className="h-4 w-4" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy</>
                )}
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Webhook Secret
            </label>
            {data?.hasSecret || newSecret ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secretValue}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pr-10 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={() => copyToClipboard(secretValue, "secret")}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {copied === "secret" ? (
                    <><Check className="h-4 w-4" /> Copied</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy</>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No webhook secret generated yet. Click the button below to create one.
              </p>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-700">
            <button
              onClick={generateSecret}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={"h-4 w-4" + (generating ? " animate-spin" : "")} />
              {generating ? "Generating..." : data?.hasSecret ? "Regenerate Secret" : "Generate Secret"}
            </button>
          </div>
        </div>
      </div>

      {/* Integration Example */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Integration Example
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Send conversions to your webhook endpoint:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100 whitespace-pre-wrap">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Novaclio-Webhook-Secret: YOUR_SECRET" \\
  -d '{"shortCode":"abc123","type":"purchase","value":29.99}'`}
        </pre>
      </div>
    </div>
  );
}
