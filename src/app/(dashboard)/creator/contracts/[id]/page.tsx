import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CreatorContractPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id as string
  const creator = await db.creatorProfile.findUnique({ where: { userId } })
  if (!creator) notFound()
  const contract = await db.contract.findUnique({
    where: { id: params.id },
    include: {
      brand: { include: { user: true } },
      creator: { include: { user: true } },
      videoSubmissions: true,
    },
  })

  if (!contract || contract.creatorId !== creator.id) {
    notFound()
  }

  const amtFormatted = (contract.amountKobo / 100).toLocaleString('en-NG')
  const deadline = new Date(contract.deadline).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const createdAt = new Date(contract.createdAt).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const statusColors: Record<string, string> = {
    PENDING_CREATOR_SIGN: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
    ACTIVE: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    SUBMITTED: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
    COMPLETED: 'bg-green-500/20 text-green-400 border border-green-500/40',
    CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/40',
  }
  const statusLabels: Record<string, string> = {
    PENDING_CREATOR_SIGN: 'Awaiting Your Signature',
    ACTIVE: 'Active',
    SUBMITTED: 'Under Review',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Back link */}
      <Link
        href="/creator/contracts"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition"
      >
        <span>&#8592;</span> Back to Contracts
      </Link>

      {/* Contract Document */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">

        {/* Document Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Creator Services Agreement</p>
              <h1 className="text-2xl font-bold text-white">Contract #{contract.id.slice(-8).toUpperCase()}</h1>
              <p className="text-sm text-gray-400 mt-1">Issued {createdAt} via Novaclio</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[contract.status] ?? 'bg-gray-700 text-gray-300'}`}>
              {statusLabels[contract.status] ?? contract.status}
            </span>
          </div>
        </div>

        {/* Parties */}
        <div className="px-8 py-6 border-b border-gray-700/60 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Brand (Client)</p>
            <p className="text-white font-semibold text-lg">{contract.brand.companyName}</p>
            <p className="text-gray-400 text-sm mt-0.5">{contract.brand.user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Creator (You)</p>
            <p className="text-white font-semibold text-lg">{contract.creator.user.name}</p>
            <p className="text-gray-400 text-sm mt-0.5">{contract.creator.user.email}</p>
          </div>
        </div>

        {/* Contract Terms */}
        <div className="px-8 py-6 border-b border-gray-700/60 space-y-6">
          <h2 className="text-sm text-gray-500 uppercase tracking-widest">Contract Terms</h2>

          {/* Deliverable */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/40">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Deliverable</p>
            <p className="text-white text-base leading-relaxed">{contract.deliverable}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Platform</p>
              <p className="text-white font-medium">{contract.platform ?? ''}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Payment</p>
              <p className="text-green-400 font-semibold text-lg">&#8358;{amtFormatted}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Deadline</p>
              <p className="text-white font-medium">{deadline}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Revisions Allowed</p>
              <p className="text-white font-medium">{contract.revisions} revision{contract.revisions !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Usage Rights */}
          {contract.usageRights && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Usage Rights</p>
              <p className="text-gray-300 text-sm leading-relaxed">{contract.usageRights}</p>
            </div>
          )}

          {/* Additional Terms */}
          {contract.additionalTerms && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Additional Terms</p>
              <p className="text-gray-300 text-sm leading-relaxed">{contract.additionalTerms}</p>
            </div>
          )}
        </div>

        {/* Escrow Note */}
        <div className="px-8 py-4 border-b border-gray-700/60 bg-blue-950/30">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-lg mt-0.5">&#128274;</span>
            <div>
              <p className="text-blue-300 text-sm font-medium">Escrow Protected Payment</p>
              <p className="text-blue-400/70 text-xs mt-0.5">
                When you sign, &#8358;{amtFormatted} will be locked in escrow by Novaclio and released to you upon brand approval of your deliverable.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Section */}
        {contract.status === 'PENDING_CREATOR_SIGN' && (
          <div className="px-8 py-6">
            <h2 className="text-lg font-bold text-white mb-1">Sign & Accept Contract</h2>
            <p className="text-gray-400 text-sm mb-5">
              By clicking the button below, you confirm you have read and agree to all terms above. This action is binding and will activate the contract.
            </p>
            <form action={`/api/contracts/${contract.id}/sign`} method="POST">
              <button
                type="submit"
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-base transition"
              >
                &#9999; Sign &amp; Accept Contract
              </button>
            </form>
            <p className="text-center text-xs text-gray-600 mt-3">
              You agree on behalf of yourself as the creator. Novaclio holds escrow in trust.
            </p>
          </div>
        )}

        {/* Active State */}
        {contract.status === 'ACTIVE' && (
          <div className="px-8 py-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-4">
              <p className="text-blue-400 font-semibold mb-1">Contract Active &#10003;</p>
              <p className="text-blue-300/70 text-sm">You signed this contract. &#8358;{amtFormatted} is held in escrow. Complete the deliverable and submit your video below.</p>
            </div>
            <Link href={`/creator/contracts/${contract.id}/submit`}>
              <button className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-base transition">
                Submit Deliverable
              </button>
            </Link>
          </div>
        )}

        {/* Submitted State */}
        {contract.status === 'SUBMITTED' && (
          <div className="px-8 py-6">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
              <p className="text-purple-400 font-semibold mb-1">Deliverable Under Review</p>
              <p className="text-purple-300/70 text-sm">Your submission is being reviewed by the brand. Payment will be released upon approval.</p>
            </div>
          </div>
        )}

        {/* Completed State */}
        {contract.status === 'COMPLETED' && (
          <div className="px-8 py-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
              <p className="text-green-400 font-semibold mb-1">Contract Completed &#127881;</p>
              <p className="text-green-300/70 text-sm">This contract is fulfilled. &#8358;{amtFormatted} has been released to your earnings.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
