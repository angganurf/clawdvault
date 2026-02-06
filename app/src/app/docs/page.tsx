'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Script from 'next/script';

export default function DocsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#1a1a2e]">
      <Header />

      {/* SDK & CLI Quick Start */}
      <section className="py-8 px-6 bg-gradient-to-b from-gray-900/50 to-transparent border-b border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">🚀 Quick Start</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* SDK */}
            <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <span>📦</span> SDK (Recommended)
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                Full TypeScript SDK for programmatic access to all ClawdVault features.
              </p>
              <pre className="bg-gray-900 rounded px-3 py-2 text-sm overflow-x-auto mb-3">
                <code className="text-orange-400">npm install @clawdvault/sdk</code>
              </pre>
              <pre className="bg-gray-900 rounded px-3 py-2 text-sm overflow-x-auto text-gray-300">
{`import { ClawdVault } from '@clawdvault/sdk';
const vault = new ClawdVault();
const tokens = await vault.tokens.list();`}
              </pre>
              <a 
                href="https://www.npmjs.com/package/@clawdvault/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-orange-400 hover:text-orange-300 text-sm"
              >
                View on npm →
              </a>
            </div>

            {/* CLI */}
            <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <span>⌨️</span> CLI
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                Command-line tool for quick operations. Perfect for scripting and automation.
              </p>
              <pre className="bg-gray-900 rounded px-3 py-2 text-sm overflow-x-auto mb-3">
                <code className="text-orange-400">npm install -g @clawdvault/cli</code>
              </pre>
              <pre className="bg-gray-900 rounded px-3 py-2 text-sm overflow-x-auto text-gray-300">
{`# List tokens
clawdvault tokens list

# Get token info
clawdvault token get <MINT>`}
              </pre>
              <a 
                href="https://www.npmjs.com/package/@clawdvault/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-orange-400 hover:text-orange-300 text-sm"
              >
                View on npm →
              </a>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm">
            <a 
              href="https://github.com/shadowclawai/clawdvault-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
            >
              ⭐ GitHub: shadowclawai/clawdvault-sdk
            </a>
          </p>
        </div>
      </section>

      <section className="flex-1">
        {/* Scalar API Reference - full width */}
        <div 
          id="api-reference"
          data-url="/openapi.yaml"
          data-proxy-url="https://proxy.scalar.com"
        />
      </section>

      <Footer />

      {/* Scalar CDN */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" 
        strategy="afterInteractive"
      />

      <style jsx global>{`
        /* Dark theme for Scalar */
        :root {
          --scalar-background-1: #1a1a2e;
          --scalar-background-2: #111827;
          --scalar-background-3: #0d1117;
          --scalar-color-1: #ffffff;
          --scalar-color-2: #d1d5db;
          --scalar-color-3: #9ca3af;
          --scalar-color-accent: #f97316;
          --scalar-border-color: #374151;
        }
        .scalar-api-reference {
          --scalar-radius: 8px;
          --scalar-radius-lg: 12px;
        }
      `}</style>
    </main>
  );
}
