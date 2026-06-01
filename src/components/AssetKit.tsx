"use client";

import { useState } from "react";

interface AssetKitProps {
  trackingLinkId: string;
  shortCode: string;
  trackingUrl: string;
  qrCodeUrl: string | null;
  campaignTitle?: string;
  onQrUpdated?: (qrCodeUrl: string) => void;
}

const SHARE_TEMPLATES = [
  {
    label: "Instagram caption",
    text: (url: string, campaign?: string) =>
      `Excited to share this with you 💫\n\nCheck it out 👉 ${url}\n\n${campaign ? `#${campaign.replace(/\s+/g, "")} ` : ""}#sponsored`,
  },
  {
    label: "TikTok caption",
    text: (url: string, campaign?: string) =>
      `tap the link in my bio 🔗\n\n${url}\n\n${campaign ? `#${campaign.replace(/\s+/g, "")} ` : ""}#fyp #ad`,
  },
  {
    label: "Twitter/X",
    text: (url: string, campaign?: string) =>
      `${campaign ? `${campaign} — ` : ""}sharing because I actually use it.\n\n${url}`,
  },
  {
    label: "WhatsApp",
    text: (url: string, campaign?: string) =>
      `Hey! ${campaign ? `Just joined the ${campaign} program. ` : ""}If you've been looking for this, check it out: ${url}`,
  },
];

export default function AssetKit(props: AssetKitProps) {
  const { trackingLinkId, shortCode, trackingUrl, campaignTitle, onQrUpdated } =
    props;
  const [qrCodeUrl, setQrCodeUrl] = useState(props.qrCodeUrl);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [pinning, setPinning] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(label);
      setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  const pinPermanentQr = async () => {
    try {
      setPinning(true);
      setPinError(null);
      const res = await fetch(
        `/api/creator/tracking-links/${trackingLinkId}/qr`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to pin QR");
      }
      const data = await res.json();
      const url = data.link?.qrCodeUrl ?? null;
      setQrCodeUrl(url);
      if (url && onQrUpdated) onQrUpdated(url);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Failed to pin QR");
    } finally {
      setPinning(false);
    }
  };

  const isPinned =
    !!qrCodeUrl && !qrCodeUrl.startsWith("https://api.qrserver.com");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">Asset kit</h3>
        <p className="text-sm text-gray-400 mt-1">
          Short link, QR code, and ready-made share copy for{" "}
          <span className="font-mono text-gray-300">{shortCode}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="flex flex-col items-center gap-2">
          {qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeUrl}
              alt={`QR code for ${shortCode}`}
              className="w-40 h-40 bg-white rounded-lg p-2"
            />
          ) : (
            <div className="w-40 h-40 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-xs">
              No QR yet
            </div>
          )}
          {!isPinned && (
            <button
              onClick={pinPermanentQr}
              disabled={pinning}
              className="text-xs text-blue-400 hover:underline disabled:opacity-50"
            >
              {pinning ? "Pinning…" : "Pin permanent QR"}
            </button>
          )}
          {pinError && (
            <p className="text-xs text-red-400 text-center">{pinError}</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
              Short URL
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={trackingUrl}
                className="flex-1 px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm font-mono"
              />
              <button
                onClick={() => copyText(trackingUrl, "URL")}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg"
              >
                {copyStatus === "URL" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">
              Share copy
            </label>
            <div className="space-y-2">
              {SHARE_TEMPLATES.map((tpl) => {
                const text = tpl.text(trackingUrl, campaignTitle);
                return (
                  <div
                    key={tpl.label}
                    className="border border-gray-800 rounded-lg p-3 bg-black/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 font-medium">
                        {tpl.label}
                      </span>
                      <button
                        onClick={() => copyText(text, tpl.label)}
                        className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded"
                      >
                        {copyStatus === tpl.label ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans">
                      {text}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
