import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'

export default async function BrandContractPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id as string
  const brand = await db.brandProfile.findUnique({ where: { userId } })
  if (!brand) notFound()
  const contract = await db.contract.findUnique({
    where: { id: params.id },
    include: {
      brand: { include: { user: true } },
      creator: { include: { user: true } },
      escrowPayment: true,
      videoSubmissions: true,
    },
  })

  if (!contract || contract.brandId !== brand.id) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    PENDING_CREATOR_SIGN: 'bg-yellow-600/20 text-yellow-400',
    ACTIVE: 'bg-blue-600/20 text-blue-400',
    SUBMITTED: 'bg-orange-600/20 text-orange-400',
    COMPLETED: 'bg-green-600/20 text-green-400',
  }

  const amountNGN = (contract.amountKobo / 100).toLocaleString('en-NG')

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-bold text-white">Contract Details</h1>
          <span
            className={"px-4 py-2 rounded text-sm font-medium " + (statusColors[contract.status] || "bg-gray-700 text-gray-300")}
          >
            {contract.status}
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Creator</p>
              <p className="text-white font-medium">{contract.creator.user.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Deliverable</p>
              <p className="text-white font-medium">{contract.deliverable}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Platform</p>
              <p className="text-white font-medium">{contract.platform}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Amount</p>
              <p className="text-white font-medium">{amountNGN}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Deadline</p>
              <p className="text-white font-medium">
                {new Date(contract.deadline).toLocaleDateString('en-NG')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Revisions</p>
              <p className="text-white font-medium">{contract.revisions}</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">Usage Rights</h3>
            <p className="text-gray-300">{contract.usageRights}</p>
          </div>

          {contract.additionalTerms && (
            <div className="border-t border-gray-800 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Additional Terms
              </h3>
              <p className="text-gray-300">{contract.additionalTerms}</p>
            </div>
          )}
        </div>

        {contract.videoSubmissions.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Video Submissions</h2>
            {contract.videoSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-800 rounded p-4 mb-4 last:mb-0"
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-white font-medium">Submission #{submission.id.slice(0, 8)}</p>
                  <span
                  className={"px-3 py-1 rounded text-xs font-medium " + (
                    submission.status === "AI_APPROVED"
                      ? "bg-green-600/20 text-green-400"
                      : submission.status === "AI_REJECTED"
                      ? "bg-red-600/20 text-red-400"
                      : "bg-yellow-600/20 text-yellow-400"
                  )}
                  >
                    {submission.status}
                  </span>
                </div>
                {submission.aiAnalysis && (
                  <div className="bg-gray-800 rounded p-3 mb-3">
                    <p className="text-gray-300 text-sm">{submission.aiAnalysis}</p>
                  </div>
                )}
                <a
                  href={submission.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 text-sm"
                >
                  View Video 
                </a>
              </div>
            ))}
          </div>
        )}

        {contract.status === 'SUBMITTED' && contract.escrowPayment?.status === 'HELD' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
            <form action={`/api/contracts/${contract.id}/release`} method="POST">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition mb-3"
              >
                Release Payment
              </button>
            </form>
            <button
              className="w-full px-6 py-3 bg-violet-600 text-white rounded font-medium hover:bg-violet-700 transition"
              onClick={() => {
                const amount = prompt('Enter tip amount in Naira:')
                if (amount) {
                  fetch(`/api/contracts/${contract.id}/tip`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amountKobo: parseInt(amount) * 100 }),
                  }).then((res) => {
                    if (res.ok) alert('Tip sent!')
                    else alert('Failed to send tip')
                  })
                }
              }}
            >
              Send Tip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
