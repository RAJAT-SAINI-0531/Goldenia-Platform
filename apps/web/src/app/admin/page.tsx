'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Load admin data when page opens
  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  async function checkAdminAndFetchData() {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current user to check if admin
      const userRes = await fetch('http://localhost:4000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      const userData = await userRes.json();
      
      // Check if user is admin
      if (userData.user.role !== 'admin') {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return;
      }

      // Fetch admin stats
      const statsRes = await fetch('http://localhost:4000/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch users (first page)
      const usersRes = await fetch('http://localhost:4000/api/v1/admin/users?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      // Fetch recent transactions (first page)
      const txRes = await fetch('http://localhost:4000/api/v1/admin/transactions?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions);
      }

    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform management and monitoring</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">KYC Verified</div>
            <div className="text-3xl font-bold text-green-600">{stats.kycVerified}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">KYC Pending</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.kycPending}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Trades</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalTrades}</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left"
        >
          <div className="font-bold text-lg">View All Users</div>
          <div className="text-sm opacity-90">Manage user accounts</div>
        </button>
        
        <button
          onClick={() => router.push('/admin/transactions')}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left"
        >
          <div className="font-bold text-lg">View All Transactions</div>
          <div className="text-sm opacity-90">Monitor platform activity</div>
        </button>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg text-left"
        >
          <div className="font-bold text-lg">Back to Dashboard</div>
          <div className="text-sm opacity-90">Return to main dashboard</div>
        </button>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Users</h2>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">KYC Status</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{user.email}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
                      user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.kycStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
          <button
            onClick={() => router.push('/admin/transactions')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">From</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">To</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">{tx.type}</td>
                  <td className="py-3 px-4 text-sm">{tx.fromWallet.type}</td>
                  <td className="py-3 px-4 text-sm">{tx.toWallet.type}</td>
                  <td className="py-3 px-4 text-sm">{tx.amount} {tx.currency}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
