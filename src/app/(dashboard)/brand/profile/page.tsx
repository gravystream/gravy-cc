"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Camera, Building2, Globe, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

interface BrandProfileData {
  companyName: string;
  slug: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  industry: string;
  location: string;
}

export default function BrandProfilePage() {
  const [profile, setProfile] = useState<BrandProfileData>({
    companyName: "", slug: "", description: "", logoUrl: "", websiteUrl: "", industry: "", location: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile/brand");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile({
              companyName: data.profile.companyName || "",
              slug: data.profile.slug || "",
              description: data.profile.description || "",
              logoUrl: data.profile.logoUrl || "",
              websiteUrl: data.profile.websiteUrl || "",
              industry: data.profile.industry || "",
              location: data.profile.location || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!document.querySelector('script[src*="cloudinary"]')) {
      const s = document.createElement('script');
      s.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);


  function openUploadWidget() {
    if (!(window as any).cloudinary) {
      setMessage({ type: "error", text: "Upload widget is loading, please try again in a moment." });
      return;
    }
    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "di8dtknsq",
        uploadPreset: "gravy_videos",
        sources: ["local", "url", "camera"],
        multiple: false,
        maxFileSize: 5000000,
        cropping: true,
        croppingAspectRatio: 1,
        resourceType: "image",
        folder: "brand-logos",
      },
      (error: any, result: any) => {
        if (error) {
          console.error("Upload error:", error);
          setMessage({ type: "error", text: "Upload failed: " + (error.message || "Unknown error. Please try again.") });
          return;
        }
        if (result?.event === "success") {
          setProfile((prev) => ({ ...prev, logoUrl: result.info.secure_url }));
          setMessage({ type: "success", text: "Logo uploaded successfully!" });
          setTimeout(() => setMessage(null), 3000);
        }
      }
    );
    widget.open();
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
            <div className="w-full max-w-2xl mx-4 mx-auto py-8 px-4">
        <Link href="/brand" className="inline-flex items-center text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Brand Profile</h1>
        <p className="text-gray-400 text-sm mb-8">Manage your brand identity and company information</p>

        {message && (
          <div className={"mb-6 p-4 rounded-lg text-sm " + (message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-400" : "bg-red-900/50 border border-red-700 text-red-400")}>
            {message.text}
          </div>
        )}

        {/* Logo Upload */}
        <div className="mb-8 flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={openUploadWidget}>
            <div className="w-24 h-24 rounded-xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden group-hover:border-purple-500 transition-colors">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-gray-600" />
              )}
            </div>
            <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-white font-medium">Brand Logo</p>
            <p className="text-gray-500 text-sm">Click to upload. Max 5MB, square recommended.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Company Name *</label>
            <input
              type="text"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Profile Slug</label>
            <div className="flex items-center bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden focus-within:border-purple-500 transition-colors">
              <span className="px-3 text-gray-500 text-sm">novaclio.io/brand/</span>
              <input
                type="text"
                value={profile.slug}
                onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="flex-1 bg-transparent px-2 py-3 text-white placeholder-gray-500 focus:outline-none"
                placeholder="your-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              rows={4}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              placeholder="Tell creators about your brand..."
            />
          </div>

          <div className="grid stagger-children grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                <Globe className="w-3.5 h-3.5 inline mr-1" />Website
              </label>
              <input
                type="url"
                value={profile.websiteUrl}
                onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://yoursite.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 inline mr-1" />Industry
              </label>
              <select
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">Select industry</option>
                <option value="beauty">Beauty & Skincare</option>
                <option value="fashion">Fashion & Apparel</option>
                <option value="tech">Technology</option>
                <option value="food">Food & Beverage</option>
                <option value="health">Health & Wellness</option>
                <option value="finance">Finance</option>
                <option value="entertainment">Entertainment</option>
                <option value="education">Education</option>
                <option value="travel">Travel & Hospitality</option>
                <option value="ecommerce">E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />Location
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Lagos, Nigeria"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </>
  );
}