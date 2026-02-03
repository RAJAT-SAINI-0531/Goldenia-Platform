'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getAccessToken, clearTokens } from '@/lib/auth';

function WalletCard({ wallet, onViewTransactions }: { wallet: any; onViewTransactions: (id: string) => void }) {
  const getWalletIcon = (type: string) => {
    if (type === 'fiat') return '$';
    if (type === 'gold') return 'Au';
    if (type === 'silver') return 'Ag';
    if (type === 'bpc') return 'BPC';
    return type;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-gray-700">{getWalletIcon(wallet.type)}</span>
        <span className={`text-xs px-2 py-1 rounded ${wallet.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {wallet.status}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-500 uppercase">{wallet.type} Wallet</h3>
      <p className="text-2xl font-bold text-gray-900 mt-2">
        {wallet.balance.toFixed(2)} <span className="text-sm text-gray-500">{wallet.currency}</span>
      </p>
      <button
        onClick={() => onViewTransactions(wallet.id)}
        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
      >
        View Transactions
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const userResponse = await apiClient.get('/auth/me');
        setUser(userResponse.data.user);

        const walletsResponse = await apiClient.get('/wallet/my-wallets');
        setWallets(walletsResponse.data.wallets);

        try {
          const notifResponse = await apiClient.get('/notifications/unread-count');
          setUnreadCount(notifResponse.data.count);
        } catch (notifError) {
          setUnreadCount(0);
        }

        // Fetch dashboard stats
        try {
          console.log('Fetching stats...');
          const statsResponse = await apiClient.get('/wallet/stats');
          console.log('Stats response:', statsResponse.data);
          setStats(statsResponse.data.stats);
          console.log('Stats set:', statsResponse.data.stats);
        } catch (statsError) {
          console.error('Failed to fetch stats:', statsError);
        }
      } catch (error) {
        clearTokens();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const handleViewTransactions = (walletId: string) => {
    router.push(`/dashboard/transactions?walletId=${walletId}`);
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
                onClick={() => router.push('/dashboard/notifications')}
                className="relative text-gray-700 hover:text-gray-900"
              >
                <span className="text-2xl">&#128276;</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <span className="text-gray-700">{user?.email}</span>
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user?.kycStatus !== 'verified' && (
          <div className={`rounded-lg p-4 mb-6 ${
            user?.kycStatus === 'pending' ? 'bg-yellow-100 border-yellow-400' :
            user?.kycStatus === 'rejected' ? 'bg-red-100 border-red-400' :
            'bg-blue-100 border-blue-400'
          } border`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">
                  KYC Status: <span className="uppercase">{user?.kycStatus}</span>
                </h3>
                <p className="text-sm text-gray-600">
                  {user?.kycStatus === 'unverified' && 'Complete KYC verification to unlock all features'}
                  {user?.kycStatus === 'pending' && 'Your documents are under review'}
                  {user?.kycStatus === 'rejected' && 'Your KYC was rejected. Please resubmit documents'}
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/kyc')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {user?.kycStatus === 'unverified' ? 'Start KYC' : 'View KYC'}
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards - Simple 3 card layout */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Card 1: Total USD Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total USD Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${stats.totalUsdBalance.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">$</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalTransactions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">&#128179;</span>
                </div>
              </div>
            </div>

            {/* Card 3: Total Wallets */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Wallets</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalWallets}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">&#128179;</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">My Wallets</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard/deposit')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
              >
                Add Money
              </button>
              <button
                onClick={() => router.push('/dashboard/trade')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-medium"
              >
                Trade Gold & Silver
              </button>
              <button
                onClick={() => router.push('/dashboard/transfer')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Transfer Money
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.map(wallet => (
              <WalletCard key={wallet.id} wallet={wallet} onViewTransactions={handleViewTransactions} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Account Info</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-bold text-gray-700 mb-2">Profile</h3>
              <p className="text-sm text-gray-600">Email: {user?.email}</p>
              <p className="text-sm text-gray-600">Role: {user?.role}</p>
              <p className="text-sm text-gray-600">KYC Status: {user?.kycStatus}</p>
              
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Full Profile →
              </button>
            </div>
            
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-bold text-gray-700 mb-2">Quick Links</h3>
              <ul className="text-sm space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/dashboard/history')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View All Transactions →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/alerts')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Manage Price Alerts →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/settings')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Account Settings →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/kyc')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Manage KYC →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/trade')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Trade Assets →
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        {stats && stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
              <button
                onClick={() => router.push('/dashboard/history')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {stats.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tx.type}</p>
                    <p className="text-sm text-gray-600">
                      {tx.fromWallet.type} → {tx.toWallet.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {tx.amount.toFixed(2)} {tx.fromWallet.currency}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
