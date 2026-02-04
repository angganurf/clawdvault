/**
 * One-time script to sync all token reserves from on-chain
 * Run from app dir: npx ts-node scripts/sync-reserves.ts
 */

import { PrismaClient } from '@prisma/client';

const API_BASE = process.env.API_BASE || 'https://clawdvault.com';

async function main() {
  const prisma = new PrismaClient();

  console.log('🦞 Syncing all token reserves from on-chain...\n');

  const tokens = await prisma.token.findMany({
    where: { graduated: false },
  });

  console.log(`Found ${tokens.length} tokens to sync\n`);

  let updated = 0;
  let errors = 0;

  for (const token of tokens) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the existing stats API
      const res = await fetch(`${API_BASE}/api/stats?mint=${token.mint}`);
      const data = await res.json();

      if (!data.success || !data.onChain) {
        console.log(`⚠️ ${token.symbol}: No on-chain data`);
        continue;
      }

      const { virtualSolReserves, virtualTokenReserves } = data.onChain;
      const dbVirtualSol = Number(token.virtualSolReserves);

      if (Math.abs(virtualSolReserves - dbVirtualSol) > 0.0001) {
        await prisma.token.update({
          where: { mint: token.mint },
          data: {
            virtualSolReserves: virtualSolReserves,
            virtualTokenReserves: virtualTokenReserves,
          },
        });
        
        console.log(`✅ ${token.symbol}: ${dbVirtualSol.toFixed(4)} → ${virtualSolReserves.toFixed(4)} SOL`);
        updated++;
      } else {
        console.log(`✓ ${token.symbol}: Already in sync`);
      }
    } catch (err) {
      console.error(`❌ ${token.symbol}: ${err}`);
      errors++;
    }
  }

  console.log(`\n🦞 Done! Updated: ${updated}, Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch(console.error);
