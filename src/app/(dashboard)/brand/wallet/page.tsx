import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import TopUpForm from './_components/TopUpForm'
import { redirect } from 'next/navigation'

export default async function BrandWalletPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id as string

  const brand = await db.brandProfile.findUnique({
    where: { userId },
  })

  if (!brand) {
    redirect('/onboarding/brand')
  }

  let wallet = await db.brandWallet.findUnique({
    where: { brandId: brand.id },
  })

  if (!wallet) {
    wallet = await db.brandWallet.create({
      data: { brandId: brand.id, balanceKobo: 0 },
    })
  }

  const transactions = await db.brandWalletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const balanceNGN = (wallet.balanceKobo / 100).toLocaleString('en-NG')

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Wallet</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Available Balance</p>
            <p className="text-4xl font-bold text-white">{balanceNGN}</p>
          </div>

          <TopUpForm />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-400">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-800">
                  <tr className="text-gray-400">
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition"
                    >
                      <td className="py-3 px-4 text-white">
                        <span className="bg-violet-600/20 text-violet-400 px-3 py-1 rounded text-xs font-medium">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {(tx.amountKobo / 100).toLocaleString('en-NG')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                            className={"px-3 py-1 rounded text-xs font-medium " + (
                              tx.status === 'COMPLETED'
                                ? 'bg-green-600/20 text-green-400'
                                : tx.status === 'PENDING'
                                ? 'bg-yellow-600/20 text-yellow-400'
                                : 'bg-red-600/20 text-red-400'
                            )}
                            >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-NG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
