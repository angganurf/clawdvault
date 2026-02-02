'use client';

import { useState, useEffect } from 'react';

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check if user has dismissed the banner
    const wasDismissed = localStorage.getItem('betaBannerDismissed');
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('betaBannerDismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white px-4 py-2.5 text-center text-sm relative">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <span className="text-lg">🐺</span>
        <span>
          <strong>Beta</strong> — Raydium graduation coming soon via on-chain contract upgrade.
        </span>
        <span className="text-lg">🚀</span>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-1 transition"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
