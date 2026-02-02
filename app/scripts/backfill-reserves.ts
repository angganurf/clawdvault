/**
 * Backfill script to recalculate real_sol_reserves from existing trades
 * Run with: npx tsx scripts/backfill-reserves.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_VIRTUAL_SOL = 30;
const INITIAL_VIRTUAL_TOKENS = 1_073_000_000;
const GRADUATION_THRESHOLD_SOL = 120;

// Fee calculation (1% total: 0.5% protocol + 0.5% creator)
function calculateFees(solAmount: number) {
  const protocolFee = solAmount * 0.005;
  const creatorFee = solAmount * 0.005;
  return { protocolFee, creatorFee, totalFee: protocolFee + creatorFee };
}

async function backfillReserves() {
  console.log('🔄 Starting reserves backfill...\n');

  // Get all tokens
  const tokens = await prisma.token.findMany({
    include: {
      trades: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log(`Found ${tokens.length} tokens to process\n`);

  for (const token of tokens) {
    console.log(`\n📦 Processing: ${token.name} (${token.symbol})`);
    console.log(`   Trades: ${token.trades.length}`);
    
    if (token.trades.length === 0) {
      console.log(`   ⏭️  No trades, skipping`);
      continue;
    }

    // Start with initial reserves
    let virtualSol = INITIAL_VIRTUAL_SOL;
    let virtualTokens = INITIAL_VIRTUAL_TOKENS;
    let realSol = 0;
    let realTokens = INITIAL_VIRTUAL_TOKENS;

    // Replay all trades
    for (const trade of token.trades) {
      const solAmount = Number(trade.solAmount);
      const tokenAmount = Number(trade.tokenAmount);
      const { totalFee } = calculateFees(solAmount);
      const invariant = virtualSol * virtualTokens;

      if (trade.tradeType === 'buy') {
        // SOL goes in, tokens come out
        virtualSol = virtualSol + solAmount;
        virtualTokens = invariant / virtualSol;
        const solAfterFee = solAmount - totalFee;
        realSol = realSol + solAfterFee;
        realTokens = realTokens - tokenAmount;
      } else {
        // Tokens go in, SOL comes out
        virtualTokens = virtualTokens + tokenAmount;
        virtualSol = invariant / virtualTokens;
        const solOut = (invariant / virtualTokens) - virtualSol;
        // For sells, SOL comes out of reserves
        realSol = Math.max(0, realSol - solAmount);
        realTokens = realTokens + tokenAmount;
      }
    }

    const graduated = realSol >= GRADUATION_THRESHOLD_SOL;
    const progressPercent = (realSol / 120) * 100;

    console.log(`   Old real_sol_reserves: ${Number(token.realSolReserves)}`);
    console.log(`   New real_sol_reserves: ${realSol.toFixed(6)}`);
    console.log(`   Progress: ${progressPercent.toFixed(2)}%`);
    console.log(`   Graduated: ${graduated}`);

    // Update token
    await prisma.token.update({
      where: { id: token.id },
      data: {
        virtualSolReserves: virtualSol,
        virtualTokenReserves: virtualTokens,
        realSolReserves: realSol,
        realTokenReserves: realTokens,
        graduated,
      },
    });

    console.log(`   ✅ Updated!`);
  }

  console.log('\n\n✨ Backfill complete!');
}

backfillReserves()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
