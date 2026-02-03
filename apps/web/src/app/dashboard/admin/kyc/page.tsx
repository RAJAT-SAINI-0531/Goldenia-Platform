'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getAccessToken, clearTokens } from '@/lib/auth';

export default function AdminKycPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Get user info
      const userRes = await apiClient.get('/auth/me');
      setUser(userRes.data.user);

      // Check if admin
      if (userRes.data.user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      // Get pending submissions
      const subsRes = await apiClient.get('/kyc/admin/pending');
      setSubmissions(subsRes.data.submissions);
    } catch (err) {
      clearTokens();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // View document
  const viewDocument = async (docId: string) => {
    try {
      const res = await apiClient.get(`/kyc/document/${docId}`);
      setViewingDocument(res.data.document);
    } catch (err: any) {
      setError('Failed to load document');
    }
  };

  // Approve KYC
  const handleApprove = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this KYC?')) return;

    setError('');
    setSuccess('');

    try {
      await apiClient.post('/kyc/admin/approve', { userId });
      setSuccess('KYC approved successfully!');
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
  };

  // Reject KYC
  const handleReject = async (userId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setError('');
    setSuccess('');

    try {
      await apiClient.post('/kyc/admin/reject', { userId, reason });
      setSuccess('KYC rejected');
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject');
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
              <h1 className="text-xl font-bold text-gray-800">Goldenia - Admin KYC Review</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Admin: {user?.email}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Pending KYC Submissions ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending submissions</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{submission.email}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(submission.kycSubmittedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Documents: {submission.kycDocuments.length}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(submission)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Review KYC - {selectedUser.email}</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              {/* Documents */}
              <div className="space-y-4 mb-6">
                {selectedUser.kycDocuments.map((doc: any) => (
                  <div key={doc.id} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc.documentType.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-500">{doc.fileName}</p>
                      </div>
                      <button
                        onClick={() => viewDocument(doc.id)}
                        className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(selectedUser.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedUser.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {viewingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{viewingDocument.fileName}</h3>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              {/* Display image */}
              {viewingDocument.fileData && (
                <img
                  src={viewingDocument.fileData}
                  alt={viewingDocument.fileName}
                  className="w-full rounded"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
