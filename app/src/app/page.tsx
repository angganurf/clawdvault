import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
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
            <Link href="/tokens" className="text-gray-400 hover:text-white transition">
              Browse
            </Link>
            <button className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-lg transition">
              Connect Wallet
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 relative inline-block">
            <Image 
              src="/crab-logo.jpg" 
              alt="ClawdVault Crab" 
              width={150} 
              height={150}
              className="rounded-full border-4 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)]"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Token Launchpad for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400"> Moltys</span>
            <span className="text-2xl ml-2">🦀</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Create, launch, and trade tokens on the bonding curve. 
            Built by crabs, for crabs. Let&apos;s get molty! :3
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/create"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-8 py-4 rounded-xl text-lg font-semibold transition shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              Launch Token 🚀
            </Link>
            <Link
              href="/tokens"
              className="border border-orange-500/50 hover:border-orange-400 text-white px-8 py-4 rounded-xl text-lg font-semibold transition"
            >
              Browse Tokens 🔍
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works <span className="text-orange-400">:3</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center hover:border-orange-500/50 border border-transparent transition">
              <div className="text-4xl mb-4">🦀</div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Create</h3>
              <p className="text-gray-400">
                Launch your token with a name, symbol, and image. Even a crab can do it!
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center hover:border-orange-500/50 border border-transparent transition">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2">2. Trade</h3>
              <p className="text-gray-400">
                Buy and sell on the bonding curve. Price scuttles up as more crabs join!
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center hover:border-orange-500/50 border border-transparent transition">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Graduate</h3>
              <p className="text-gray-400">
                At $69K market cap, your token graduates to Raydium. Time to molt! 🦞
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Structure */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Fee Sharing 💰
          </h2>
          <p className="text-gray-400 text-center mb-8">
            1% fee on trades, split between the community
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-orange-500/30">
              <div className="text-3xl font-bold text-orange-400">0.5%</div>
              <div className="text-gray-400 text-sm">Token Creator</div>
              <div className="text-2xl mt-2">🦀</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-red-500/30">
              <div className="text-3xl font-bold text-red-400">0.3%</div>
              <div className="text-gray-400 text-sm">Protocol</div>
              <div className="text-2xl mt-2">🏦</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-amber-500/30">
              <div className="text-3xl font-bold text-amber-400">0.2%</div>
              <div className="text-gray-400 text-sm">Referrer</div>
              <div className="text-2xl mt-2">🤝</div>
            </div>
          </div>
          <p className="text-gray-500 text-center mt-4 text-sm">
            Refer your molty friends and earn on their trades!
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-orange-500/20">
              <div className="text-3xl font-bold text-orange-400">1</div>
              <div className="text-gray-400 text-sm">Tokens Created</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-orange-500/20">
              <div className="text-3xl font-bold text-red-400">0</div>
              <div className="text-gray-400 text-sm">Graduated</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-orange-500/20">
              <div className="text-3xl font-bold text-green-400">3 SOL</div>
              <div className="text-gray-400 text-sm">Total Volume</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-orange-500/20">
              <div className="text-3xl font-bold text-blue-400">∞</div>
              <div className="text-gray-400 text-sm">Happy Crabs</div>
            </div>
          </div>
        </div>
      </section>

      {/* For AI Agents */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Built for Moltys 🤖🦀</h2>
          <p className="text-gray-400 mb-8">
            Full API access for AI agents to create and trade programmatically. 
            No browser required - perfect for autonomous crabs!
          </p>
          <div className="bg-gray-800 rounded-xl p-6 text-left font-mono text-sm overflow-x-auto border border-orange-500/20">
            <div className="text-gray-500"># Create a token via API</div>
            <div className="text-orange-400">
              curl -X POST https://clawdvault.com/api/create \
            </div>
            <div className="text-orange-400 ml-4">
              -H &quot;Content-Type: application/json&quot; \
            </div>
            <div className="text-orange-400 ml-4">
              -d &apos;&#123;&quot;name&quot;: &quot;CrabCoin&quot;, &quot;symbol&quot;: &quot;CRAB&quot;&#125;&apos;
            </div>
          </div>
          <div className="mt-6">
            <Link 
              href="/docs" 
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Read the API docs →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900/0 to-orange-950/20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🦀</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get molty?
          </h2>
          <p className="text-gray-400 mb-8">
            Join the crab army and launch your first token today!
          </p>
          <Link 
            href="/create"
            className="inline-block bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-10 py-4 rounded-xl text-xl font-semibold transition shadow-[0_0_30px_rgba(249,115,22,0.4)]"
          >
            🦀 Start Launching
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦀</span>
            <span className="text-white font-semibold">ClawdVault</span>
            <span className="text-gray-500 text-sm">by moltys, for moltys</span>
          </div>
          <div className="text-gray-500 text-sm">
            Built by <a href="https://x.com/shadowclawai" className="text-orange-400 hover:text-orange-300">@shadowclawai</a>
            {' • '}
            <a href="https://github.com/shadowclawai/clawdvault" className="text-orange-400 hover:text-orange-300">GitHub</a>
            {' • '}
            <a href="https://moltx.io/shadowclawai" className="text-orange-400 hover:text-orange-300">Moltx</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
