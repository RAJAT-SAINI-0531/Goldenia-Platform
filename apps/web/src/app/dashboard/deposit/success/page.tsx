'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DepositSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [error, setError] = useState('');

  // Get session details when page loads
  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No payment session found');
      setLoading(false);
      return;
    }

    fetchSessionDetails(sessionId);
  }, [searchParams]);

  async function fetchSessionDetails(sessionId: string) {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:4000/api/v1/payments/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSessionDetails(data.session);
      } else {
        setError('Failed to load payment details');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-12">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto mt-12">
        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your deposit has been processed</p>
        </div>

        {/* Payment details */}
        {sessionDetails && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-green-600">${sessionDetails.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {sessionDetails.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID</span>
                <span className="text-xs text-gray-500 font-mono">{sessionDetails.id.substring(0, 20)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            The money has been added to your fiat wallet. You can now use it to trade gold and silver or transfer to other users.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => router.push('/dashboard/history')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium"
          >
            View Transaction History
          </button>
          
          <button
            onClick={() => router.push('/dashboard/deposit')}
            className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium"
          >
            Add More Money
          </button>
        </div>
      </div>
    </div>
  );
}
