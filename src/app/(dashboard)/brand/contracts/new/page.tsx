'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Other']

interface CreatorProfile {
  id: string
  displayName: string | null
  username: string
  baseRateKobo: number | null
  platforms: string[]
}

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const creatorId = searchParams.get('creatorId') || ''

  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    deliverable: '',
    platform: 'Instagram',
    deadline: '',
    amountNaira: '',
    revisions: 2,
    usageRights: '',
    additionalTerms: '',
  })

  useEffect(() => {
    if (!creatorId) { setLoading(false); return }
    fetch('/api/creators/' + creatorId)
      .then(r => r.json())
      .then(data => setCreator(data.creator ?? data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [creatorId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.deliverable || !form.platform || !form.deadline || !form.amountNaira) {
      setError('Please fill in all required fields.')
      return
    }
    if (!creator) return
    setSubmitting(true)
    setError('')
    try {
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: creator.id }),
      })
      if (!convRes.ok) throw new Error('Failed to create conversation')
      const { conversationId } = await convRes.json()

      const contractRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          creatorId: creator.id,
          deliverable: form.deliverable,
          platform: form.platform,
          deadline: form.deadline,
          amountKobo: Math.round(parseFloat(form.amountNaira) * 100),
          revisions: form.revisions,
          usageRights: form.usageRights || null,
          additionalTerms: form.additionalTerms || null,
        }),
      })
      if (!contractRes.ok) throw new Error('Failed to create contract')
      const { contractId } = await contractRes.json()
      router.push('/brand/contracts/' + contractId)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayName = creator?.displayName || creator?.username || 'Creator'
  const rateNaira = creator?.baseRateKobo ? (creator.baseRateKobo / 100).toLocaleString('en-NG') : null
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Create Contract</h1>
        </div>
        {creator && (
          <p className="text-gray-400 mb-8 ml-9">
            Hiring <span className="text-violet-400 font-medium">{displayName}</span>
            {rateNaira ? ' · Starting at ₦' + rateNaira + '/post' : ''}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deliverable <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 1 Instagram Reel, 2 TikTok videos"
              value={form.deliverable}
              onChange={e => setForm({...form, deliverable: e.target.value})}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Platform <span className="text-red-400">*</span>
            </label>
            <select
              value={form.platform}
              onChange={e => setForm({...form, platform: e.target.value})}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deadline <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm({...form, deadline: e.target.value})}
                min={today}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (₦) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={form.amountNaira}
                onChange={e => setForm({...form, amountNaira: e.target.value})}
                min="1"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Revisions Allowed</label>
            <input
              type="number"
              value={form.revisions}
              onChange={e => setForm({...form, revisions: parseInt(e.target.value) || 0})}
              min="0"
              max="10"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Usage Rights <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 6 months digital, no paid ads"
              value={form.usageRights}
              onChange={e => setForm({...form, usageRights: e.target.value})}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Terms <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Any other requirements or details..."
              value={form.additionalTerms}
              onChange={e => setForm({...form, additionalTerms: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {form.amountNaira && (
            <div className="p-4 bg-gray-900 border border-violet-900/40 rounded-xl">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Summary</p>
              <p className="text-white font-semibold">
                ₦{parseFloat(form.amountNaira || '0').toLocaleString('en-NG')}
                {' · '}{form.platform}{form.deadline ? ' · Due ' + form.deadline : ''}
              </p>
              <p className="text-gray-500 text-xs mt-1">This amount will be held in escrow until the work is approved.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30"
          >
            {submitting ? 'Creating Contract...' : 'Send Contract to Creator'}
          </button>
        </form>
      </div>
    </div>
  )
}
