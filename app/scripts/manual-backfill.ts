/**
 * Manual backfill for missing initial buy trades
 * Initial buys don't emit TradeEvent, so we calculate from bonding curve math
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bonding curve math: k = virtual_sol * virtual_token
const INITIAL_VIRTUAL_SOL = 30; // Starting virtual SOL reserves
const INITIAL_VIRTUAL_TOKEN = 1_000_000_000; // Starting virtual token reserves (1B)
const K = INITIAL_VIRTUAL_SOL * INITIAL_VIRTUAL_TOKEN; // Constant product = 30B

// Calculate tokens received for SOL input (after fees)
function calculateTokensOut(solIn: number, currentVirtualSol: number = INITIAL_VIRTUAL_SOL): { tokensOut: number; newVirtualSol: number; newVirtualToken: number } {
  const fee = solIn * 0.01; // 1% total fee
  const solNet = solIn - fee;
  
  const newVirtualSol = currentVirtualSol + solNet;
  const newVirtualToken = K / newVirtualSol;
  const tokensOut = (K / currentVirtualSol) - newVirtualToken;
  
  return { tokensOut, newVirtualSol, newVirtualToken };
}

// Known missing initial buys
const missingTrades = [
  {
    tokenMint: 'B7KpChn4dxioeuNzzEY9eioUwEi5xt5KYegytRottJgZ', // ClawdVault
    trader: '3X8b5mRCzvvyVXarimyujxtCZ1Epn22oXVWbzUoxWKRH', // Me (ShadowClaw)
    solAmount: 0.15, // Initial buy
    isInitialBuy: true,
    timestamp: new Date('2026-02-03T21:46:27.376Z'), // Same as token creation
  },
  {
    tokenMint: 'HBcnWuDkZAPZ3qSUy6e8UkPZM3cCvs72DmYZavCaBaeM', // Shadow Wolf
    trader: '3X8b5mRCzvvyVXarimyujxtCZ1Epn22oXVWbzUoxWKRH', // Me
    solAmount: 0.10, // Initial buy (0.1 SOL on-chain)
    isInitialBuy: true,
    timestamp: new Date('2026-02-02T10:18:00.341Z'),
  },
  {
    tokenMint: 'UUELtRkR5C6Yd5qq5sZoWztFEFe6V73VbuYYXEqoQiQ', // Crab
    trader: '7b9191rMLP8yZaKYudWiFtFZwtaEYX5Tyy2hZeEKDyWq', // Different creator
    solAmount: 0.01, // Initial buy (0.01 SOL on-chain)
    isInitialBuy: true,
    timestamp: new Date('2026-02-02T10:00:14.242Z'),
  },
];

async function main() {
  console.log('Starting manual backfill...\n');
  
  for (const trade of missingTrades) {
    // Get token
    const token = await prisma.token.findUnique({
      where: { mint: trade.tokenMint },
      select: { id: true, name: true }
    });
    
    if (!token) {
      console.log(`Token not found: ${trade.tokenMint}`);
      continue;
    }
    
    // Check if trade already exists (by looking for matching sol amount + trader around same time)
    const existing = await prisma.trade.findFirst({
      where: {
        tokenMint: trade.tokenMint,
        trader: trade.trader,
        solAmount: { gte: trade.solAmount - 0.001, lte: trade.solAmount + 0.001 },
      }
    });
    
    if (existing) {
      console.log(`${token.name}: Trade already exists, skipping`);
      continue;
    }
    
    // Calculate tokens bought using bonding curve
    const { tokensOut, newVirtualSol, newVirtualToken } = calculateTokensOut(trade.solAmount);
    const priceSol = newVirtualSol / newVirtualToken;
    
    console.log(`=== ${token.name} ===`);
    console.log(`  SOL: ${trade.solAmount}`);
    console.log(`  Tokens: ${tokensOut.toLocaleString()}`);
    console.log(`  Price: ${priceSol.toFixed(12)} SOL/token`);
    
    // Insert trade
    await prisma.trade.create({
      data: {
        tokenId: token.id,
        tokenMint: trade.tokenMint,
        trader: trade.trader,
        tradeType: 'buy',
        solAmount: trade.solAmount,
        tokenAmount: tokensOut,
        priceSol: priceSol,
        protocolFee: trade.solAmount * 0.005,
        creatorFee: trade.solAmount * 0.005,
        totalFee: trade.solAmount * 0.01,
        signature: `initial-buy-${trade.tokenMint.slice(0, 8)}`, // Unique placeholder
        createdAt: trade.timestamp,
      }
    });
    
    console.log(`  ✅ Inserted!\n`);
  }
  
  console.log('Backfill complete!');
  await prisma.$disconnect();
}

main().catch(console.error);
