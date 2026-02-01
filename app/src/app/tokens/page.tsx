'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Token, TokenListResponse } from '@/lib/types';

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('created_at');

  useEffect(() => {
    fetchTokens();
  }, [sort]);

  const fetchTokens = async () => {
    try {
      const res = await fetch(`/api/tokens?sort=${sort}`);
      const data: TokenListResponse = await res.json();
      setTokens(data.tokens);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) return '<0.000001 SOL';
    if (price < 0.001) return price.toFixed(6) + ' SOL';
    return price.toFixed(4) + ' SOL';
  };

  const formatMcap = (mcap: number) => {
    if (mcap >= 1000) return (mcap / 1000).toFixed(1) + 'K SOL';
    return mcap.toFixed(2) + ' SOL';
  };

  const formatVolume = (vol?: number) => {
    if (!vol) return '--';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
    return vol.toFixed(2);
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
            <Link href="/create" className="text-gray-400 hover:text-white transition">
              Create Token
            </Link>
            <Link href="/tokens" className="text-white font-medium">
              Browse
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">All Tokens</h1>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="created_at">Newest</option>
              <option value="market_cap">Market Cap</option>
              <option value="volume">24h Volume</option>
              <option value="price">Price</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="animate-pulse">Loading tokens...</div>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🐺</div>
              <h2 className="text-xl font-bold text-white mb-2">No tokens yet</h2>
              <p className="text-gray-400 mb-6">Be the first to launch!</p>
              <Link
                href="/create"
                className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-lg transition"
              >
                Create Token
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {tokens.map((token) => (
                <Link
                  key={token.mint}
                  href={`/tokens/${token.mint}`}
                  className="bg-gray-800/50 border border-gray-700 hover:border-orange-500 rounded-xl p-4 transition flex items-center gap-4"
                >
                  {/* Image */}
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {token.image ? (
                      <img src={token.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      '🪙'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">${token.symbol}</span>
                      {token.graduated && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                          🎓 Graduated
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm truncate">{token.name}</div>
                    <div className="text-gray-500 text-xs">by {token.creator_name || 'Anonymous'}</div>
                  </div>

                  {/* Stats */}
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-mono">{formatPrice(token.price_sol)}</div>
                    <div className="text-gray-500 text-sm">Price</div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-orange-400 font-mono">{formatMcap(token.market_cap_sol)}</div>
                    <div className="text-gray-500 text-sm">MCap</div>
                  </div>
                  <div className="text-right hidden lg:block">
                    <div className="text-blue-400 font-mono">{formatVolume(token.volume_24h)} SOL</div>
                    <div className="text-gray-500 text-sm">24h Vol</div>
                  </div>
                  <div className="text-right hidden lg:block">
                    <div className="text-gray-400 font-mono">{token.trades_24h || 0}</div>
                    <div className="text-gray-500 text-sm">Trades</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
