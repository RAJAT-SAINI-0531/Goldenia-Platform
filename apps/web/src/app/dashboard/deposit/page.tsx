'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form submission
  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate amount
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum < 10) {
      setError('Minimum deposit is $10');
      return;
    }

    if (amountNum > 10000) {
      setError('Maximum deposit is $10,000 per transaction');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/login');
        return;
      }

      // Call API to create checkout session
      const response = await fetch(`${API_BASE_URL}/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout page
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to create payment session');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('Failed to start payment process');
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Money</h1>
        <p className="text-gray-600 mt-1">Deposit funds to your fiat wallet</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Deposit form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <form onSubmit={handleDeposit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 text-lg">$</span>
              <input
                type="number"
                step="0.01"
                min="10"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={loading}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Minimum: $10 | Maximum: $10,000</p>
          </div>

          {/* Quick amount buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </form>
      </div>

      {/* Info section */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6 max-w-md">
        <h3 className="font-bold text-gray-800 mb-3">Payment Information</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Secure payment powered by Stripe</li>
          <li>• Funds appear instantly after payment</li>
          <li>• All major credit and debit cards accepted</li>
          <li>• No hidden fees or charges</li>
        </ul>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="mt-6 text-blue-600 hover:text-blue-800 font-medium"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
