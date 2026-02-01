'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreateTokenRequest, CreateTokenResponse } from '@/lib/types';

export default function CreatePage() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateTokenResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const body: CreateTokenRequest = {
        name,
        symbol,
        description: description || undefined,
        image: image || undefined,
      };

      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: CreateTokenResponse = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create token');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦀</span>
            <span className="text-xl font-bold text-white">ClawdVault</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/create" className="text-white font-medium">
              Create Token
            </Link>
            <Link href="/tokens" className="text-gray-400 hover:text-white transition">
              Browse
            </Link>
          </nav>
        </div>
      </header>

      {/* Form */}
      <section className="py-12 px-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Launch Your Token 🚀</h1>
          <p className="text-gray-400 mb-8">
            Create a new token on the bonding curve. No coding required.
          </p>

          {result?.success ? (
            <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
              <h2 className="text-xl font-bold text-green-400 mb-2">✅ Token Created!</h2>
              <p className="text-gray-300 mb-4">
                Your token <span className="font-bold">${result.token?.symbol}</span> is now live.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm mb-4">
                <div className="text-gray-500">Mint Address:</div>
                <div className="text-orange-400 break-all">{result.mint}</div>
              </div>
              <div className="flex gap-4">
                <Link
                  href={`/tokens/${result.mint}`}
                  className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-lg transition"
                >
                  View Token
                </Link>
                <button
                  onClick={() => {
                    setResult(null);
                    setName('');
                    setSymbol('');
                    setDescription('');
                    setImage('');
                  }}
                  className="border border-gray-600 hover:border-orange-500 text-white px-6 py-2 rounded-lg transition"
                >
                  Create Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-2">
                  Token Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wolf Pack Token"
                  maxLength={32}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
                <div className="text-gray-500 text-sm mt-1">{name.length}/32 characters</div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. WOLF"
                  maxLength={10}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none uppercase"
                />
                <div className="text-gray-500 text-sm mt-1">{symbol.length}/10 characters</div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's your token about?"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 text-sm">
                <div className="text-amber-400 font-medium mb-2">ℹ️ Token Parameters</div>
                <ul className="text-gray-400 space-y-1">
                  <li>• Initial supply: 1,073,000,000 tokens</li>
                  <li>• Starting price: ~0.000028 SOL</li>
                  <li>• 1% fee on all trades</li>
                  <li>• Graduates to Raydium at ~$69K market cap</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || !name || !symbol}
                className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition"
              >
                {loading ? 'Creating...' : 'Launch Token 🚀'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
