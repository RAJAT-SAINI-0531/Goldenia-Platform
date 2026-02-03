'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getAccessToken, clearTokens } from '@/lib/auth';

export default function KycPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

      // Get uploaded documents
      const docsRes = await apiClient.get('/kyc/my-documents');
      setDocuments(docsRes.data.documents);
    } catch (err) {
      clearTokens();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Upload document
  const handleFileUpload = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Upload
      await apiClient.post('/kyc/upload', {
        documentType,
        fileName: file.name,
        fileData: base64
      });

      setSuccess(`${documentType.replace('_', ' ')} uploaded successfully!`);
      
      // Reload documents
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Submit for review
  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/kyc/submit');
      setSuccess('KYC submitted for review! We will notify you once approved.');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    }
  };

  // Check if document type is uploaded
  const isUploaded = (type: string) => {
    return documents.some(d => d.documentType === type);
  };

  // Get document status
  const getDocStatus = (type: string) => {
    return documents.find(d => d.documentType === type);
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
              <h1 className="text-xl font-bold text-gray-800">Goldenia - KYC Verification</h1>
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
        {/* KYC Status */}
        <div className={`rounded-lg p-4 mb-6 ${
          user?.kycStatus === 'verified' ? 'bg-green-100 border-green-400' :
          user?.kycStatus === 'pending' ? 'bg-yellow-100 border-yellow-400' :
          user?.kycStatus === 'rejected' ? 'bg-red-100 border-red-400' :
          'bg-blue-100 border-blue-400'
        } border`}>
          <h3 className="font-bold text-gray-800">
            KYC Status: <span className="uppercase">{user?.kycStatus}</span>
          </h3>
          {user?.kycStatus === 'verified' && (
            <p className="text-sm text-gray-600 mt-1">
              Your account is verified! You can now access all features.
            </p>
          )}
          {user?.kycStatus === 'pending' && (
            <p className="text-sm text-gray-600 mt-1">
              Your documents are under review. We will notify you soon.
            </p>
          )}
          {user?.kycStatus === 'rejected' && (
            <div className="text-sm text-gray-600 mt-1">
              <p>Your KYC was rejected.</p>
              {user?.kycRejectionReason && (
                <p className="font-medium">Reason: {user.kycRejectionReason}</p>
              )}
              <p>Please upload documents again.</p>
            </div>
          )}
        </div>

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

        {/* Document Upload Section */}
        {user?.kycStatus !== 'verified' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Documents</h2>
            <p className="text-gray-600 mb-6">
              Please upload the following documents to verify your identity:
            </p>

            <div className="space-y-4">
              {/* ID Proof */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-700">1. ID Proof</h3>
                    <p className="text-sm text-gray-500">Passport, Driver License, or National ID</p>
                    {getDocStatus('id_proof') && (
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        getDocStatus('id_proof').status === 'approved' ? 'bg-green-100 text-green-700' :
                        getDocStatus('id_proof').status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getDocStatus('id_proof').status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={`cursor-pointer px-4 py-2 rounded ${
                      isUploaded('id_proof') ? 'bg-gray-300 text-gray-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}>
                      {isUploaded('id_proof') ? 'Re-upload' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload('id_proof', e)}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Address Proof */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-700">2. Address Proof</h3>
                    <p className="text-sm text-gray-500">Utility bill, Bank statement (not older than 3 months)</p>
                    {getDocStatus('address_proof') && (
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        getDocStatus('address_proof').status === 'approved' ? 'bg-green-100 text-green-700' :
                        getDocStatus('address_proof').status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getDocStatus('address_proof').status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={`cursor-pointer px-4 py-2 rounded ${
                      isUploaded('address_proof') ? 'bg-gray-300 text-gray-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}>
                      {isUploaded('address_proof') ? 'Re-upload' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload('address_proof', e)}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Selfie */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-700">3. Selfie</h3>
                    <p className="text-sm text-gray-500">Clear photo of your face holding your ID</p>
                    {getDocStatus('selfie') && (
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        getDocStatus('selfie').status === 'approved' ? 'bg-green-100 text-green-700' :
                        getDocStatus('selfie').status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getDocStatus('selfie').status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={`cursor-pointer px-4 py-2 rounded ${
                      isUploaded('selfie') ? 'bg-gray-300 text-gray-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}>
                      {isUploaded('selfie') ? 'Re-upload' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('selfie', e)}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            {isUploaded('id_proof') && isUploaded('address_proof') && isUploaded('selfie') && 
             user?.kycStatus === 'unverified' && (
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded"
                >
                  Submit for Review
                </button>
              </div>
            )}

            {uploading && (
              <div className="mt-4 text-center text-gray-600">
                Uploading...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
