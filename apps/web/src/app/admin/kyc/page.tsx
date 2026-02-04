'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';

interface KycRequest {
  id: string;
  email: string;
  kycStatus: string;
  kycSubmittedAt: string;
  kycDocuments: Array<{
    id: string;
    documentType: string;
    filePath: string;
    status: string;
  }>;
}

export default function AdminKycPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/kyc-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        alert('Admin access required');
        router.push('/dashboard');
        return;
      }

      const data = await res.json();
      setRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const token = localStorage.getItem('accessToken');
    
    try {
      const res = await fetch(`${API_BASE_URL}/kyc/admin/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (res.ok) {
        alert('KYC approved successfully');
        fetchRequests(); // Refresh list
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to approve KYC');
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const token = localStorage.getItem('accessToken');
    
    try {
      const res = await fetch(`${API_BASE_URL}/kyc/admin/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, reason })
      });

      const data = await res.json();

      if (res.ok) {
        alert('KYC rejected');
        fetchRequests(); // Refresh list
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to reject KYC');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
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
              <h1 className="text-xl font-bold text-gray-800">Goldenia Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-700 hover:text-gray-900"
              >
                Back to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">KYC Requests Management</h1>

        {requests.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <p className="text-gray-500">No pending KYC requests</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">User Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Submitted</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Documents</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4">{request.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                        {request.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.kycSubmittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {request.kycDocuments.length} document(s)
                      <div className="text-xs text-gray-500">
                        {request.kycDocuments.map(doc => doc.documentType).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
