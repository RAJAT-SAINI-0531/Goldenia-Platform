'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getAccessToken, clearTokens } from '@/lib/auth';

export default function TransferPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    // Load user's wallets
    const fetchWallets = async () => {
      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await apiClient.get('/wallet/my-wallets');
        setWallets(response.data.wallets);
      } catch (error) {
        clearTokens();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Simple validation
    if (!fromWalletId || !toWalletId) {
      setError('Please select both wallets');
      return;
    }

    if (fromWalletId === toWalletId) {
      setError('Cannot transfer to the same wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      // Call transfer API
      const response = await apiClient.post('/wallet/transfer', {
        fromWalletId,
        toWalletId,
        amount: parseFloat(amount),
        description: description || 'Transfer'
      });

      if (response.data.success) {
        setSuccess('Transfer successful!');
        // Clear form
        setAmount('');
        setDescription('');
        // Reload wallets to show new balances
        const walletsResponse = await apiClient.get('/wallet/my-wallets');
        setWallets(walletsResponse.data.wallets);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Goldenia</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Transfer Money</h2>

          {/* Show current balances */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-700 mb-2">Current Balances</h3>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map(wallet => (
                <div key={wallet.id} className="text-sm">
                  <span className="font-medium">{wallet.type.toUpperCase()}:</span>{' '}
                  <span className="text-gray-600">{wallet.balance.toFixed(2)} {wallet.currency}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            {/* From Wallet */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                From Wallet
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                required
              >
                <option value="">Select wallet</option>
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.type.toUpperCase()} - Balance: {wallet.balance.toFixed(2)} {wallet.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* To Wallet */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                To Wallet
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                required
              >
                <option value="">Select wallet</option>
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.type.toUpperCase()} - Balance: {wallet.balance.toFixed(2)} {wallet.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="0.00"
                required
              />
            </div>

            {/* Description (optional) */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="What is this transfer for?"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Transfer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
