'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Handle waitlist form submission
  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/api/v1/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, name })
      });

      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage(data.message);
        setEmail('');
        setName('');
      } else {
        setMessageType('error');
        setMessage(data.message);
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-yellow-500">
            Goldenia
          </div>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-white hover:text-yellow-500"
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/signup')}
              className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Buy, Sell & Trade<br />
          <span className="text-yellow-500">Gold & Silver</span> Digitally
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Invest in precious metals with confidence. Secure, transparent, and backed by real physical assets.
        </p>
        
        {/* Waitlist Form */}
        <form onSubmit={handleJoinWaitlist} className="max-w-md mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Join the Waitlist</h3>
            
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 mb-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 mb-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Get Early Access'}
            </button>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                messageType === 'success' 
                  ? 'bg-green-500 bg-opacity-20 text-green-300' 
                  : 'bg-red-500 bg-opacity-20 text-red-300'
              }`}>
                {message}
              </div>
            )}
          </div>
        </form>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-900">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Account</h3>
            <p className="text-gray-400">
              Sign up in minutes and complete a simple verification process.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-900">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Add Funds</h3>
            <p className="text-gray-400">
              Deposit money securely using cards, PayPal, or bank transfer.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-900">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Trade Metals</h3>
            <p className="text-gray-400">
              Buy, sell, and trade gold and silver at real-time market prices.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Goldenia?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">100% Backed</h3>
            <p className="text-gray-400">
              Every gram is backed by real physical gold and silver in secure vaults.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Instant Trading</h3>
            <p className="text-gray-400">
              Buy and sell 24/7 at live market prices with no delays.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Low Fees</h3>
            <p className="text-gray-400">
              Transparent pricing with competitive fees and no hidden charges.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Secure & Insured</h3>
            <p className="text-gray-400">
              Bank-level security with full insurance coverage on all holdings.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-gray-700">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-bold text-yellow-500 mb-4">Goldenia</div>
            <p className="text-gray-400 text-sm">
              The future of digital precious metals trading.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-yellow-500">About Us</a></li>
              <li><a href="#" className="hover:text-yellow-500">Security</a></li>
              <li><a href="#" className="hover:text-yellow-500">Vault & Reserves</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-yellow-500">Terms of Service</a></li>
              <li><a href="#" className="hover:text-yellow-500">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-yellow-500">Risk Disclosure</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-yellow-500">FAQ</a></li>
              <li><a href="#" className="hover:text-yellow-500">Support</a></li>
              <li><a href="#" className="hover:text-yellow-500">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>2026 Goldenia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
