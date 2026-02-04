'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';

// Page for managing price alerts
export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>({ gold: 0, silver: 0 });
  const [loading, setLoading] = useState(true);
  
  // Form state for creating new alert
  const [asset, setAsset] = useState('gold');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');

  useEffect(() => {
    fetchAlerts();
    fetchPrices();
  }, []);

  const fetchAlerts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${API_BASE_URL}/trading/prices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // data.prices is an array: [{ asset: 'gold', priceUsd: 50 }, { asset: 'silver', priceUsd: 25 }]
        const goldPrice = data.prices.find((p: any) => p.asset === 'gold');
        const silverPrice = data.prices.find((p: any) => p.asset === 'silver');
        
        setPrices({
          gold: goldPrice?.priceUsd || 0,
          silver: silverPrice?.priceUsd || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset,
          targetPrice: parseFloat(targetPrice),
          condition
        })
      });

      if (res.ok) {
        alert('Price alert created!');
        setTargetPrice('');
        fetchAlerts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      alert('Failed to create alert');
    }
  };

  const deleteAlert = async (alertId: string) => {
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <p>Loading alerts...</p>
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

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Price Alerts</h1>

        {/* Current Prices */}
        <div className="bg-white rounded-lg p-4 mb-6 border">
          <h2 className="font-bold mb-3">Current Prices</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Gold</div>
              <div className="text-2xl font-bold">${prices.gold.toFixed(2)}/gram</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Silver</div>
              <div className="text-2xl font-bold">${prices.silver.toFixed(2)}/gram</div>
            </div>
          </div>
        </div>

        {/* Create New Alert */}
        <div className="bg-white rounded-lg p-6 mb-6 border">
          <h2 className="font-bold mb-4">Create New Alert</h2>
          <form onSubmit={createAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Asset</label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="above">Price goes above</option>
                <option value="below">Price goes below</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Price (USD per gram)</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter target price"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create Alert
            </button>
          </form>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-lg p-6 border">
          <h2 className="font-bold mb-4">Your Alerts</h2>
          
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No alerts created yet</p>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.triggered ? 'bg-gray-50 border-gray-300' : 'bg-white border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{alert.asset.toUpperCase()}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          alert.triggered ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-gray-700">
                        Notify when price goes <strong>{alert.condition}</strong> ${alert.targetPrice.toFixed(2)}/gram
                      </p>
                      {alert.triggered && (
                        <p className="text-sm text-green-600 mt-1">
                          Triggered on {new Date(alert.triggeredAt).toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created on {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
