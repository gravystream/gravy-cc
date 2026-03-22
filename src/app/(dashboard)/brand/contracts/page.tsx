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
  PENDING_CREATOR_SIGN: 'Pending Sign',
  ACTIVE:               'Active',
  SUBMITTED:            'Submitted',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
}

export default async function BrandContractsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id as string

  const brand = await db.brandProfile.findUnique({ where: { userId } })
  if (!brand) redirect('/onboarding/brand')

  const allContracts = await db.contract.findMany({
    where: { brandId: brand.id },
    include: {
      creator: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const tab = searchParams?.tab || 'all'

  const filtered = allContracts.filter(c => {
    if (tab === 'all')     return true
    if (tab === 'pending') return c.status === 'PENDING_CREATOR_SIGN'
    if (tab === 'active')  return c.status === 'ACTIVE' || c.status === 'SUBMITTED'
    if (tab === 'completed') return c.status === 'COMPLETED'
    return true
  })

  // Stats
  const totalSpentKobo   = allContracts.filter(c => c.status === 'COMPLETED').reduce((s, c) => s + c.amountKobo, 0)
  const pendingCount     = allContracts.filter(c => c.status === 'PENDING_CREATOR_SIGN').length
  const activeCount      = allContracts.filter(c => c.status === 'ACTIVE' || c.status === 'SUBMITTED').length
  const completedCount   = allContracts.filter(c => c.status === 'COMPLETED').length
  const committedKobo    = allContracts.filter(c => c.status === 'ACTIVE' || c.status === 'SUBMITTED').reduce((s, c) => s + c.amountKobo, 0)

  const fmt = (kobo: number) => (kobo / 100).toLocaleString('en-NG')

  const tabs = [
    { key: 'all',       label: `All (${allContracts.length})` },
    { key: 'pending',   label: `Pending Sign (${pendingCount})` },
    { key: 'active',    label: `Active (${activeCount})` },
    { key: 'completed', label: `Completed (${completedCount})` },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Contracts</h1>
          <p className="text-gray-400 mt-1">Track all your creator contracts and spending</p>
        </div>
        <Link
          href="/brand/discover"
          className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition text-sm"
        >
          + New Contract
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Spent</p>
          <p className="text-white text-2xl font-bold">{fmt(totalSpentKobo)}</p>
          <p className="text-gray-500 text-xs mt-1">on completed contracts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">In Escrow</p>
          <p className="text-blue-400 text-2xl font-bold">{fmt(committedKobo)}</p>
          <p className="text-gray-500 text-xs mt-1">active contracts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Pending Sign</p>
          <p className="text-yellow-400 text-2xl font-bold">{pendingCount}</p>
          <p className="text-gray-500 text-xs mt-1">awaiting creator</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Completed</p>
          <p className="text-green-400 text-2xl font-bold">{completedCount}</p>
          <p className="text-gray-500 text-xs mt-1">fulfilled contracts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/brand/contracts?tab=${t.key}`}
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
          <p className="text-gray-400 text-sm mb-6">Hire a creator to create your first contract</p>
          <Link href="/brand/discover" className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition text-sm">
            Browse Creators
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const amountNGN = fmt(contract.amountKobo)
            const deadline  = new Date(contract.deadline).toLocaleDateString('en-NG')
            const created   = new Date(contract.createdAt).toLocaleDateString('en-NG')
            return (
              <Link
                key={contract.id}
                href={`/brand/contracts/${contract.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-violet-700 hover:bg-gray-900/80 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[contract.status] || 'bg-gray-700 text-gray-300'}`}>
                        {statusLabels[contract.status] || contract.status}
                      </span>
                      <span className="text-gray-500 text-xs">{contract.platform}</span>
                      <span className="text-gray-500 text-xs">Created {created}</span>
                    </div>
                    <p className="text-white font-medium mb-1 truncate group-hover:text-violet-300 transition">
                      {contract.deliverable}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Creator: <span className="text-gray-300">{(contract.creator as any).user?.name || (contract.creator as any).username}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-lg">{amountNGN}</p>
                    <p className="text-gray-500 text-xs mt-1">Due {deadline}</p>
                    <p className="text-gray-600 text-xs">{contract.revisions} revision{contract.revisions !== 1 ? 's' : ''}</p>
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
