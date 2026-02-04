import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';

const PROGRAM_ID = new PublicKey('GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM');
const TOKEN_DECIMALS = 6;
const prisma = new PrismaClient();

async function main() {
  const conn = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
  
  const tokens = await prisma.token.findMany({
    select: { id: true, mint: true, name: true }
  });
  
  for (const token of tokens) {
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), new PublicKey(token.mint).toBuffer()],
      PROGRAM_ID
    );
    
    const account = await conn.getAccountInfo(bondingCurve);
    if (!account) continue;
    
    const data = account.data;
    let offset = 8 + 32 + 32;
    
    const virtualSol = Number(data.readBigUInt64LE(offset)) / LAMPORTS_PER_SOL;
    offset += 8;
    const virtualToken = Number(data.readBigUInt64LE(offset)) / Math.pow(10, TOKEN_DECIMALS);
    offset += 8;
    const realSol = Number(data.readBigUInt64LE(offset)) / LAMPORTS_PER_SOL;
    offset += 8;
    const realToken = Number(data.readBigUInt64LE(offset)) / Math.pow(10, TOKEN_DECIMALS);
    
    console.log(`${token.name}:`);
    console.log(`  On-chain: vSol=${virtualSol.toFixed(4)} vTok=${virtualToken.toFixed(0)}`);
    console.log(`            rSol=${realSol.toFixed(6)} rTok=${realToken.toFixed(0)}`);
    
    await prisma.token.update({
      where: { id: token.id },
      data: {
        virtualSolReserves: virtualSol,
        virtualTokenReserves: virtualToken,
        realSolReserves: realSol,
        realTokenReserves: realToken,
      }
    });
    console.log(`  ✅ Updated!\n`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
