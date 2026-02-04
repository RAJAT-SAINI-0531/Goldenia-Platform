'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';

interface AssetPrice {
  asset: string;
  priceUsd: number;
  updatedAt: string;
}

export default function AdminPricesPage() {
  const router = useRouter();
  const [prices, setPrices] = useState<AssetPrice[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [goldPrice, setGoldPrice] = useState('');
  const [silverPrice, setSilverPrice] = useState('');

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/trading/prices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPrices(data.prices);
        
        const gold = data.prices.find((p: AssetPrice) => p.asset === 'gold');
        const silver = data.prices.find((p: AssetPrice) => p.asset === 'silver');
        
        if (gold) setGoldPrice(gold.priceUsd.toString());
        if (silver) setSilverPrice(silver.priceUsd.toString());
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (asset: 'gold' | 'silver', price: string) => {
    const token = localStorage.getItem('accessToken');
    const priceNum = parseFloat(price);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/trading/admin/update-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ asset, price: priceNum })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`${asset} price updated to $${priceNum}/gram`);
        fetchPrices(); // Refresh prices
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to update price');
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

      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Manage Asset Prices</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gold Price */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-600 mb-4">Gold Price</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Price</label>
              <div className="text-3xl font-bold text-gray-800">
                ${prices.find(p => p.asset === 'gold')?.priceUsd.toFixed(2)}/gram
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {prices.find(p => p.asset === 'gold')?.updatedAt 
                  ? new Date(prices.find(p => p.asset === 'gold')!.updatedAt).toLocaleString()
                  : 'N/A'}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Price ($/gram)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={goldPrice}
                onChange={(e) => setGoldPrice(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter new gold price"
              />
            </div>

            <button
              onClick={() => handleUpdatePrice('gold', goldPrice)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded font-medium"
            >
              Update Gold Price
            </button>
          </div>

          {/* Silver Price */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-600 mb-4">Silver Price</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Price</label>
              <div className="text-3xl font-bold text-gray-800">
                ${prices.find(p => p.asset === 'silver')?.priceUsd.toFixed(2)}/gram
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {prices.find(p => p.asset === 'silver')?.updatedAt 
                  ? new Date(prices.find(p => p.asset === 'silver')!.updatedAt).toLocaleString()
                  : 'N/A'}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Price ($/gram)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={silverPrice}
                onChange={(e) => setSilverPrice(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter new silver price"
              />
            </div>

            <button
              onClick={() => handleUpdatePrice('silver', silverPrice)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-medium"
            >
              Update Silver Price
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Price changes take effect immediately for all users</li>
            <li>- Prices are in USD per gram</li>
            <li>- Users will see the new prices when they buy/sell</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
