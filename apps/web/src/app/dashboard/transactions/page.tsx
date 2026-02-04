'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getAccessToken, clearTokens } from '@/lib/auth';

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletId = searchParams.get('walletId');

  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load transaction history
    const fetchTransactions = async () => {
      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      if (!walletId) {
        router.push('/dashboard');
        return;
      }

      try {
        // Get wallet info
        const walletResponse = await apiClient.get(`/wallet/${walletId}`);
        setWallet(walletResponse.data.wallet);

        // Get transactions
        const txResponse = await apiClient.get(`/wallet/${walletId}/transactions`);
        setTransactions(txResponse.data.transactions);
      } catch (error) {
        clearTokens();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [router, walletId]);

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

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction History</h2>
          
          {wallet && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-bold">{wallet.type.toUpperCase()} Wallet</span> - 
                Balance: <span className="font-bold">{wallet.balance.toFixed(2)} {wallet.currency}</span>
              </p>
            </div>
          )}

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                // Check if this is incoming or outgoing
                const isIncoming = tx.toWalletId === walletId;
                const isOutgoing = tx.fromWalletId === walletId;

                return (
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {isIncoming && (
                            <span className="text-green-600 font-bold text-sm">+ RECEIVED</span>
                          )}
                          {isOutgoing && (
                            <span className="text-red-600 font-bold text-sm">- SENT</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          {tx.description || 'Transfer'}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          From: <span className="font-medium">{tx.fromWallet.type.toUpperCase()}</span>
                          {' → '}
                          To: <span className="font-medium">{tx.toWallet.type.toUpperCase()}</span>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncoming ? '+' : '-'}{tx.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{wallet.currency}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
