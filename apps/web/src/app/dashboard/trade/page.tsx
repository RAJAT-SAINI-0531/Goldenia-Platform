'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';

interface AssetPrice {
  asset: string;
  priceUsd: number;
  updatedAt: string;
}

interface Trade {
  id: string;
  tradeType: 'buy' | 'sell';
  asset: 'gold' | 'silver';
  amountGrams: number;
  pricePerGram: number;
  totalUsd: number;
  status: string;
  createdAt: string;
}

export default function TradePage() {
  const router = useRouter();
  const [prices, setPrices] = useState<AssetPrice[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Buy form
  const [buyAsset, setBuyAsset] = useState<'gold' | 'silver'>('gold');
  const [buyAmount, setBuyAmount] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  
  // Sell form
  const [sellAsset, setSellAsset] = useState<'gold' | 'silver'>('gold');
  const [sellAmount, setSellAmount] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  // Fetch prices and trades
  const fetchData = async () => {
    try {
      // Get prices (PUBLIC - no auth needed)
      const pricesRes = await fetch(`${API_BASE_URL}/trading/prices`);
      if (pricesRes.ok) {
        const data = await pricesRes.json();
        setPrices(data.prices);
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }

    // Check authentication for trades
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return; // Keep loading=true to prevent rendering
    }

    try {
      // Get my trades (requires auth)
      const tradesRes = await fetch(`${API_BASE_URL}/trading/my-trades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tradesRes.ok) {
        const data = await tradesRes.json();
        setTrades(data.trades);
      } else {
        // Token might be invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return; // Keep loading=true
      }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle buy
  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/trading/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          asset: buyAsset,
          amountUsd: parseFloat(buyAmount)
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        setBuyAmount('');
        fetchData(); // Refresh data
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to buy asset');
    } finally {
      setBuyLoading(false);
    }
  };

  // Handle sell
  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/trading/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          asset: sellAsset,
          amountGrams: parseFloat(sellAmount)
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        setSellAmount('');
        fetchData(); // Refresh data
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to sell asset');
    } finally {
      setSellLoading(false);
    }
  };

  const goldPrice = prices.find(p => p.asset === 'gold')?.priceUsd || 0;
  const silverPrice = prices.find(p => p.asset === 'silver')?.priceUsd || 0;

  const buyGramsEstimate = buyAmount ? (parseFloat(buyAmount) / (buyAsset === 'gold' ? goldPrice : silverPrice)) : 0;
  const sellUsdEstimate = sellAmount ? (parseFloat(sellAmount) * (sellAsset === 'gold' ? goldPrice : silverPrice)) : 0;

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

      <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Trade Gold & Silver</h1>

      {/* Current Prices */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Gold</h2>
          <p className="text-3xl font-bold text-yellow-600">${goldPrice.toFixed(2)}</p>
          <p className="text-sm text-gray-600">per gram</p>
        </div>
        <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Silver</h2>
          <p className="text-3xl font-bold text-gray-600">${silverPrice.toFixed(2)}</p>
          <p className="text-sm text-gray-600">per gram</p>
        </div>
      </div>

      {/* Buy & Sell Forms */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Buy Form */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-green-600">Buy Asset</h2>
          <form onSubmit={handleBuy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Asset</label>
              <select
                value={buyAsset}
                onChange={(e) => setBuyAsset(e.target.value as 'gold' | 'silver')}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter amount in USD"
                required
              />
            </div>

            {buyAmount && (
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-700">
                  You will receive: <span className="font-bold">{buyGramsEstimate.toFixed(4)} grams</span> of {buyAsset}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={buyLoading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {buyLoading ? 'Processing...' : 'Buy'}
            </button>
          </form>
        </div>

        {/* Sell Form */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Sell Asset</h2>
          <form onSubmit={handleSell} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Asset</label>
              <select
                value={sellAsset}
                onChange={(e) => setSellAsset(e.target.value as 'gold' | 'silver')}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Amount (Grams)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter grams to sell"
                required
              />
            </div>

            {sellAmount && (
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-gray-700">
                  You will receive: <span className="font-bold">${sellUsdEstimate.toFixed(2)}</span> USD
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sellLoading}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {sellLoading ? 'Processing...' : 'Sell'}
            </button>
          </form>
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Trade History</h2>
        {trades.length === 0 ? (
          <p className="text-gray-500">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right py-2">Grams</th>
                  <th className="text-right py-2">Price/Gram</th>
                  <th className="text-right py-2">Total USD</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{new Date(trade.createdAt).toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.tradeType === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.tradeType.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 capitalize">{trade.asset}</td>
                    <td className="py-2 text-right">{trade.amountGrams.toFixed(4)}</td>
                    <td className="py-2 text-right">${trade.pricePerGram.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">${trade.totalUsd.toFixed(2)}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100">{trade.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
