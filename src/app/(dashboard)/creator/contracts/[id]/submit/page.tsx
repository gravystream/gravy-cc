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
  const [aiResult, setAiResult] = useState<{ approved: boolean; analysis: string } | null>(null);

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
          socialPostUrl: socialPostUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
          setAiResult({ approved: data.aiApproved, analysis: data.aiAnalysis ?? "" });
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
          <div className="mb-6 p-4 rounded bg-red-600/20 text-red-400">
            {message}
          </div>
        )}

        {aiResult && (
          <div className={`rounded-lg p-6 ${aiResult.approved ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${aiResult.approved ? "bg-green-100" : "bg-red-100"}`}>
                {aiResult.approved ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <h3 className={`font-semibold text-lg ${aiResult.approved ? "text-green-800" : "text-red-800"}`}>
                {aiResult.approved ? "Video Approved!" : "Video Needs Revision"}
              </h3>
            </div>
            {aiResult.analysis && (
              <p className={`text-sm mb-4 ${aiResult.approved ? "text-green-700" : "text-red-700"}`}>
                {aiResult.analysis}
              </p>
            )}
            <button
              onClick={() => router.back()}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${aiResult.approved ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
            >
              Back to Contract
            </button>
          </div>
        )}

        {!aiResult && (
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
        )}

      {/* Load Cloudinary widget script */}
      <script src="https://widget.cloudinary.com/v2.0/global/all.js" async />
    </div>
  )
}
