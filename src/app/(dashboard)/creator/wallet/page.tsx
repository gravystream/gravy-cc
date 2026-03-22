"use client";

import { useEffect, useState } from "react";

interface WalletData {
  balanceKobo: number;
  pendingKobo: number;
  bankName: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  transactions: Array<{
    id: string;
    amountKobo: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export default function CreatorWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankForm, setBankForm] = useState({ bankName: "", bankCode: "", accountNumber: "", accountName: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setWallet(d.wallet);
        if (d.wallet?.bankName) setBankForm({
          bankName: d.wallet.bankName ?? "",
          bankCode: d.wallet.bankCode ?? "",
          accountNumber: d.wallet.accountNumber ?? "",
          accountName: d.wallet.accountName ?? "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function saveBankDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { alert("Failed to save bank details"); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
    </div>
  );

  const balance = (wallet?.balanceKobo ?? 0) / 100;
  const pending = (wallet?.pendingKobo ?? 0) / 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#D4A843] to-[#b8922e] rounded-xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Available Balance</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-2">Ready for withdrawal</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-3xl font-bold text-gray-700">{pending.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting approval</p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h2>
        <p className="text-sm text-gray-500 mb-4">Add your bank account to receive payouts when brands approve your work.</p>

        <form onSubmit={saveBankDetails} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                placeholder="GTBank, Access, Zenith..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Code</label>
              <input
                type="text"
                value={bankForm.bankCode}
                onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                placeholder="058"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              placeholder="0123456789"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <input
              type="text"
              value={bankForm.accountName}
              onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#D4A843] hover:bg-[#b8922e] text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved " : "Save Bank Details"}
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
        {(wallet?.transactions ?? []).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2"></p>
            <p>No transactions yet. Complete your first job to earn!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallet!.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "CREDIT" ? "+" : "-"}{(t.amountKobo / 100).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
