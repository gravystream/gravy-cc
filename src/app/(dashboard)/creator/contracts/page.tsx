import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  PENDING_CREATOR_SIGN: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
  ACTIVE:               'bg-blue-600/20 text-blue-400 border border-blue-600/30',
  SUBMITTED:            'bg-orange-600/20 text-orange-400 border border-orange-600/30',
  COMPLETED:            'bg-green-600/20 text-green-400 border border-green-600/30',
  CANCELLED:            'bg-red-600/20 text-red-400 border border-red-600/30',
}

const statusLabels: Record<string, string> = {
  PENDING_CREATOR_SIGN: 'Pending Your Signature',
  ACTIVE:               'Active  In Progress',
  SUBMITTED:            'Submitted  Awaiting Approval',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
}

export default async function CreatorContractsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id as string

  const creator = await db.creatorProfile.findUnique({ where: { userId } })
  if (!creator) redirect('/onboarding/creator')

  const allContracts = await db.contract.findMany({
    where: { creatorId: creator.id },
    include: {
      brand: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const tab = searchParams?.tab || 'all'

  const filtered = allContracts.filter(c => {
    if (tab === 'all')       return true
    if (tab === 'pending')   return c.status === 'PENDING_CREATOR_SIGN'
    if (tab === 'active')    return c.status === 'ACTIVE' || c.status === 'SUBMITTED'
    if (tab === 'completed') return c.status === 'COMPLETED'
    return true
  })

  // Stats
  const totalEarnedKobo = allContracts.filter(c => c.status === 'COMPLETED').reduce((s, c) => s + c.amountKobo, 0)
  const pendingCount    = allContracts.filter(c => c.status === 'PENDING_CREATOR_SIGN').length
  const activeCount     = allContracts.filter(c => c.status === 'ACTIVE' || c.status === 'SUBMITTED').length
  const completedCount  = allContracts.filter(c => c.status === 'COMPLETED').length
  const pendingEarnKobo = allContracts.filter(c => c.status === 'ACTIVE' || c.status === 'SUBMITTED').reduce((s, c) => s + c.amountKobo, 0)

  const fmt = (kobo: number) => (kobo / 100).toLocaleString('en-NG')

  const tabs = [
    { key: 'all',       label: `All (${allContracts.length})` },
    { key: 'pending',   label: `Needs Signature (${pendingCount})` },
    { key: 'active',    label: `Ongoing (${activeCount})` },
    { key: 'completed', label: `Completed (${completedCount})` },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Contracts</h1>
        <p className="text-gray-400 mt-1">All your brand deals and contracts in one place</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Earned</p>
          <p className="text-green-400 text-2xl font-bold">{fmt(totalEarnedKobo)}</p>
          <p className="text-gray-500 text-xs mt-1">from completed contracts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Pending Payout</p>
          <p className="text-blue-400 text-2xl font-bold">{fmt(pendingEarnKobo)}</p>
          <p className="text-gray-500 text-xs mt-1">in active contracts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Needs Signature</p>
          <p className="text-yellow-400 text-2xl font-bold">{pendingCount}</p>
          <p className="text-gray-500 text-xs mt-1">awaiting your sign</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Completed</p>
          <p className="text-white text-2xl font-bold">{completedCount}</p>
          <p className="text-gray-500 text-xs mt-1">fulfilled contracts</p>
        </div>
      </div>

      {/* Pending Sign Alert */}
      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-xl flex items-center gap-3">
          <span className="text-2xl"></span>
          <div>
            <p className="text-yellow-400 font-medium">You have {pendingCount} contract{pendingCount > 1 ? 's' : ''} waiting for your signature</p>
            <p className="text-yellow-500 text-sm">Review and sign to activate the deal and receive payment into escrow.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/creator/contracts?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Contracts list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-4xl mb-4"></p>
          <p className="text-white text-lg font-medium mb-2">No contracts here yet</p>
          <p className="text-gray-400 text-sm mb-6">When brands send you contract offers, they will appear here</p>
          <Link href="/creator/briefs" className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition text-sm">
            Browse Briefs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const amountNGN = fmt(contract.amountKobo)
            const deadline  = new Date(contract.deadline).toLocaleDateString('en-NG')
            const created   = new Date(contract.createdAt).toLocaleDateString('en-NG')
            const brandName = (contract.brand as any).companyName || (contract.brand as any).user?.name || 'Brand'
            const isPending = contract.status === 'PENDING_CREATOR_SIGN'
            return (
              <Link
                key={contract.id}
                href={`/creator/contracts/${contract.id}`}
                className={`block bg-gray-900 border rounded-xl p-5 transition-all group ${
                  isPending
                    ? 'border-yellow-600/40 hover:border-yellow-500'
                    : 'border-gray-800 hover:border-violet-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[contract.status] || 'bg-gray-700 text-gray-300'}`}>
                        {statusLabels[contract.status] || contract.status}
                      </span>
                      <span className="text-gray-500 text-xs">{contract.platform}</span>
                      <span className="text-gray-500 text-xs">Sent {created}</span>
                    </div>
                    <p className="text-white font-medium mb-1 truncate group-hover:text-violet-300 transition">
                      {contract.deliverable}
                    </p>
                    <p className="text-gray-400 text-sm">
                      From: <span className="text-gray-300">{brandName}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-lg">{amountNGN}</p>
                    <p className="text-gray-500 text-xs mt-1">Due {deadline}</p>
                    {isPending && (
                      <span className="inline-block mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded-full font-medium">
                        Tap to sign 
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
