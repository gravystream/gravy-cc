'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TopUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [amount, setAmount] = useState(100000)
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const presets = [
    { label: '1,000', value: 100000 },
    { label: '5,000', value: 500000 },
    { label: '10,000', value: 1000000 },
    { label: '50,000', value: 5000000 },
  ]

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      verifyPayment(ref)
    }
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      setLoading(true)
      const response = await fetch("/api/wallet/verify/" + reference, {
        method: 'POST',
      })

      if (response.ok) {
        setMessage('Payment verified successfully!')
        setTimeout(() => {
          router.push('/brand/wallet')
        }, 2000)
      } else {
        setMessage('Payment verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setMessage('Error verifying payment')
    } finally {
      setLoading(false)
    }
  }

  const handleTopUp = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountKobo: amount }),
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage(error.error || 'Failed to initiate payment')
        return
      }

      const data = await response.json()
      window.location.href = data.authorizationUrl
    } catch (error) {
      console.error('TopUp error:', error)
      setMessage('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {message && (
        <div
          className={"mb-4 p-4 rounded bg-" + (message.includes("success") ? "green" : "red") + "-600/20 text-" + (message.includes("success") ? "green" : "red") + "-400"}
        >
          {message}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select Amount
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setAmount(preset.value)
                setIsCustom(false)
              }}
            className={"p-3 rounded border transition " + (
              !isCustom && amount === preset.value
                ? "border-violet-600 bg-violet-600/10 text-violet-400"
                : "border-gray-700 text-gray-300 hover:border-gray-600"
            )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Amount ()
        </label>
        <input
          type="number"
          min="1000"
          step="100"
          value={isCustom ? amount / 100 : ''}
          onChange={(e) => {
            const val = parseInt(e.target.value || '0') * 100
            setAmount(val)
            setIsCustom(true)
          }}
          placeholder="Enter amount in Naira"
          className="w-full px-4 py-2 rounded border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-violet-600 focus:outline-none"
        />
      </div>

      <button
        onClick={handleTopUp}
        disabled={loading || amount < 100000}
        className="w-full px-6 py-3 bg-violet-600 text-white rounded font-medium hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 transition"
      >
          {loading ? 'Processing...' : 'Add ₦' + (amount / 100).toLocaleString('en-NG')}
      </button>
    </div>
  )
}
