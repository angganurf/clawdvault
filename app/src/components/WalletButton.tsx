'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { authenticatedPost } from '@/lib/signRequest';

// Official Phantom logo SVG (simplified)
function PhantomIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" rx="26" fill="url(#phantom-grad)"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M97.6 52.4C97.6 67.5 85.4 79.7 70.3 79.7H57.1C56.2 79.7 55.4 80.3 55.2 81.2L52.5 94.9C52.3 95.8 51.5 96.4 50.6 96.4H39.6C38.5 96.4 37.7 95.4 37.9 94.3L49.3 35.1C49.5 34.2 50.3 33.6 51.2 33.6H74C86.1 33.6 97.6 41.6 97.6 52.4ZM70.9 48.3H63.7C62.8 48.3 62 48.9 61.8 49.8L59.1 63.5C58.9 64.4 59.7 65.2 60.6 65.2H66.9C73.2 65.2 78.3 60.1 78.3 53.8C78.3 50.1 75.1 48.3 70.9 48.3Z" fill="white"/>
      <defs>
        <linearGradient id="phantom-grad" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#534BB1"/>
          <stop offset="1" stopColor="#551BF9"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function WalletButton() {
  const wallet = useWallet();
  const { connected, connecting, initializing, publicKey, balance, connect, disconnect } = wallet;
  const [showDropdown, setShowDropdown] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch profile when connected
  const fetchProfile = useCallback(async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/profile?wallet=${publicKey}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setUsername(data.profile.username);
        setNewUsername(data.profile.username || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchProfile();
    } else {
      setUsername(null);
    }
  }, [connected, publicKey, fetchProfile]);

  // Save username
  const saveUsername = async () => {
    if (!publicKey || savingUsername) return;
    setSavingUsername(true);
    try {
      const profileData = {
        username: newUsername.trim() || null,
        avatar: null,
      };
      const res = await authenticatedPost(wallet, '/api/profile', 'profile', profileData);
      const data = await res.json();
      if (data.success) {
        setUsername(data.profile.username);
        setEditingUsername(false);
      }
    } catch (err) {
      console.error('Failed to save username:', err);
    } finally {
      setSavingUsername(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setEditingUsername(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show skeleton while checking auto-reconnect
  if (initializing) {
    return (
      <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg animate-pulse flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-600 rounded-full" />
        <div className="w-20 h-4 bg-gray-600 rounded" />
      </div>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        title="Connect your Phantom wallet to trade tokens"
        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 group"
      >
        {connecting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <PhantomIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full" />
        <span>{username || shortenAddress(publicKey!)}</span>
        {balance !== null && (
          <span className="text-gray-400 text-sm">
            {balance.toFixed(2)} SOL
          </span>
        )}
        <span className="text-gray-500">▼</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Username Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-gray-400 text-xs mb-2">Display Name</div>
            {editingUsername ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  maxLength={20}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={saveUsername}
                  disabled={savingUsername}
                  className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition"
                >
                  {savingUsername ? '...' : '✓'}
                </button>
                <button
                  onClick={() => {
                    setEditingUsername(false);
                    setNewUsername(username || '');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {username || <span className="text-gray-500 italic">Not set</span>}
                </span>
                <button
                  onClick={() => setEditingUsername(true)}
                  className="text-orange-400 hover:text-orange-300 text-sm transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Wallet Address */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Wallet Address</div>
            <div className="text-white font-mono text-sm break-all">{publicKey}</div>
          </div>
          
          {/* Balance */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Balance</div>
            <div className="text-white text-lg font-semibold">
              {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey!);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
            >
              <span>📋</span>
              Copy Address
            </button>
            <a
              href={`https://solscan.io/account/${publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition flex items-center gap-2 block"
              onClick={() => setShowDropdown(false)}
            >
              <span>🔍</span>
              View on Solscan
            </a>
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
            >
              <span>🚪</span>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
