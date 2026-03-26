'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window { cloudinary: any; }
}

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'Snapchat', 'LinkedIn'];

export default function CreatorProfilePage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    tagline: '',
    location: '',
    bio: '',
    niches: '',
    platforms: [] as string[],
    ratePerPost: '',
    availability: 'AVAILABLE',
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: '',
    avatarUrl: '',
    coverUrl: '',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    fetch('/api/profile/creator')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          const p = data.profile;
          setForm({
            displayName: p.displayName || '',
            username: p.username || '',
            tagline: p.tagline || '',
            location: p.location || '',
            bio: p.bio || '',
            niches: (p.niches || []).join(', '),
            platforms: p.platforms || [],
            ratePerPost: p.baseRateKobo ? String(Math.round(p.baseRateKobo / 100)) : '',
            availability: p.availability || 'AVAILABLE',
            instagram: p.instagramUrl || '',
            tiktok: p.tiktokUrl || '',
            youtube: p.youtubeUrl || '',
            twitter: p.twitterUrl || '',
            avatarUrl: p.avatarUrl || '',
            coverUrl: p.coverUrl || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));

    return () => {
      try { document.body.removeChild(script); } catch {}
    };
  }, []);

  const openUploadWidget = (type: 'avatar' | 'cover') => {
    if (typeof window === 'undefined' || !window.cloudinary) {
      alert('Upload widget is still loading, please try again.');
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'di8dtknsq',
        uploadPreset: 'gravy_videos',
        sources: ['local', 'url', 'camera'],
        resourceType: 'image',
        multiple: false,
        maxFiles: 1,
        folder: type === 'avatar' ? 'avatars' : 'covers',
        cropping: type === 'avatar',
        croppingAspectRatio: type === 'avatar' ? 1 : 3,
        showSkipCropButton: true,
      },
      (err: any, result: any) => {
        if (!err && result?.event === 'success') {
          const url = result.info.secure_url;
          setForm(f => ({ ...f, [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: url }));
          widget.close();
        }
      }
    );
    widget.open();
  };

  const togglePlatform = (platform: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(platform)
        ? f.platforms.filter(p => p !== platform)
        : [...f.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/profile/creator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName || undefined,
          tagline: form.tagline,
          location: form.location,
          bio: form.bio,
          niches: form.niches ? form.niches.split(',').map((n: string) => n.trim()).filter(Boolean) : [],
          platforms: form.platforms,
          baseRateKobo: form.ratePerPost ? Math.round(parseFloat(form.ratePerPost) * 100) : 0,
          availability: form.availability,
          instagramHandle: form.instagram,
          tiktokHandle: form.tiktok,
          youtubeHandle: form.youtube,
          twitterHandle: form.twitter,
          avatarUrl: form.avatarUrl || undefined,
          coverUrl: form.coverUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors text-sm';

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Your Profile</h1>
        <p className="text-gray-400 text-sm">Update your creator profile to attract brands</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Banner */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Banner Image</label>
            <button type="button" onClick={() => openUploadWidget('cover')}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              {form.coverUrl ? 'Change banner' : 'Upload banner'}
            </button>
          </div>
          <div
            onClick={() => openUploadWidget('cover')}
            className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 cursor-pointer group"
          >
            {form.coverUrl ? (
              <img src={form.coverUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Click to upload banner photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">Change Banner</span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Basic Info</h2>

          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div
                onClick={() => openUploadWidget('avatar')}
                className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 cursor-pointer group flex items-center justify-center"
              >
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-500">
                    {form.displayName ? form.displayName[0].toUpperCase() : '?'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <span className="text-xs text-gray-500">Profile Photo</span>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Display Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.displayName} required
                  onChange={e => setForm({...form, displayName: e.target.value})}
                  placeholder="Your full name" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                <input type="text" value={form.username} disabled
                  className={inp + ' opacity-40 cursor-not-allowed'} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tagline</label>
            <input type="text" value={form.tagline}
              onChange={e => setForm({...form, tagline: e.target.value})}
              placeholder="e.g. Lifestyle & Beauty Creator from Lagos" className={inp} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input type="text" value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              placeholder="e.g. Lagos, Nigeria" className={inp} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea rows={4} value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              placeholder="Tell brands about yourself, your audience, and what makes you unique..."
              className={inp + ' resize-none'} />
          </div>
        </div>

        {/* Content & Rates */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Content &amp; Rates</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Niches <span className="text-gray-500 font-normal text-xs">(comma-separated)</span>
            </label>
            <input type="text" value={form.niches}
              onChange={e => setForm({...form, niches: e.target.value})}
              placeholder="e.g. Fashion, Lifestyle, Beauty, Tech" className={inp} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.platforms.includes(p)
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rate Per Post (&#8358;)</label>
              <input type="number" min="0" value={form.ratePerPost}
                onChange={e => setForm({...form, ratePerPost: e.target.value})}
                placeholder="e.g. 50000" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
              <select value={form.availability}
                onChange={e => setForm({...form, availability: e.target.value})}
                className={inp + ' cursor-pointer'}>
                <option value="AVAILABLE">Available for work</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Social Links</h2>
            <p className="text-xs text-gray-500 mt-1">Paste your full profile URLs</p>
          </div>

          {([
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', color: 'text-pink-400' },
            { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle', color: 'text-cyan-400' },
            { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel', color: 'text-red-400' },
            { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/yourhandle', color: 'text-sky-400' },
          ] as const).map(({ key, label, placeholder, color }) => (
            <div key={key}>
              <label className={`block text-sm font-medium mb-2 ${color}`}>{label}</label>
              <input type="text" value={(form as any)[key]}
                onChange={e => setForm({...form, [key]: e.target.value})}
                placeholder={placeholder} className={inp} />
            </div>
          ))}
        </div>

        {saved && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm text-center">
            Profile saved successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
