import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const trades = await p.trade.findMany({ orderBy: { createdAt: 'asc' } });
  for (const t of trades) {
    console.log(`${t.tokenMint.slice(0,8)}... | ${t.tradeType} | ${Number(t.solAmount).toFixed(2)} SOL | ${t.createdAt.toISOString().slice(0,16)}`);
  }
  console.log(`\nTotal: ${trades.length} trades`);
  await p.$disconnect();
})();
