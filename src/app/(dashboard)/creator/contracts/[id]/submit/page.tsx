"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function SubmitVideoPage({ params }: { params: { id: string } }) {
  const contractId = params.id;
  const router = useRouter();

  const [videoUrl, setVideoUrl]         = useState("");
  const [videoPublicId, setVideoPublicId] = useState("");
  const [socialPostUrl, setSocialPostUrl] = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [message, setMessage]           = useState("");

  const openWidget = () => {
    if (typeof window === "undefined" || !window.cloudinary) {
      alert("Cloudinary not loaded yet. Please try again.");
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "di8dtknsq",
        uploadPreset: "novaclio_videos",
        sources: ["local", "camera"],
        resourceType: "video",
        maxFileSize: 200000000,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setVideoUrl(result.info.secure_url);
          setVideoPublicId(result.info.public_id);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/contracts/" + contractId + "/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          videoPublicId,
          socialPostUrl: socialPostUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Video submitted successfully! Awaiting review.");
        setTimeout(() => {
          router.push("/creator/contracts/" + contractId);
        }, 2000);
      } else {
        setMessage(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">Submit Promotional Video</h1>
      <p className="text-gray-400 text-sm mb-6">Upload your video and provide your social post link.</p>

      {message && (
        <div
          className={"mb-6 p-4 rounded " + (message.includes("successfully") ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400")}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Promotional Video *
          </label>
          {videoUrl ? (
            <div className="space-y-2">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg max-h-64 bg-gray-900"
              />
              <button
                type="button"
                onClick={() => { setVideoUrl(""); setVideoPublicId(""); }}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove video
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openWidget}
              className="w-full border-2 border-dashed border-gray-600 rounded-lg py-8 text-gray-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2"></div>
                <p className="font-medium">Click to upload video</p>
                <p className="text-xs mt-1 text-gray-500">MP4, MOV, AVI up to 200MB</p>
              </div>
            </button>
          )}
        </div>

        {/* Social Post URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Social Post URL (optional)
          </label>
          <input
            type="url"
            value={socialPostUrl}
            onChange={(e) => setSocialPostUrl(e.target.value)}
            placeholder="https://instagram.com/post/..."
            className="w-full px-4 py-2 rounded border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-violet-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!videoUrl || submitting}
          className="w-full px-6 py-3 bg-violet-600 text-white rounded font-medium hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Video"}
        </button>
      </form>

      {/* Load Cloudinary widget script */}
      <script src="https://widget.cloudinary.com/v2.0/global/all.js" async />
    </div>
  )
}
