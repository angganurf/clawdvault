import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM');
const TOKEN_DECIMALS = 6;

const tokens = [
  { name: 'ClawdVault', mint: 'B7KpChn4dxioeuNzzEY9eioUwEi5xt5KYegytRottJgZ' },
  { name: 'Shadow Wolf', mint: 'HBcnWuDkZAPZ3qSUy6e8UkPZM3cCvs72DmYZavCaBaeM' },
  { name: 'Crab', mint: 'UUELtRkR5C6Yd5qq5sZoWztFEFe6V73VbuYYXEqoQiQ' },
];

const TOTAL_SUPPLY = 1_000_000_000; // 1B tokens

async function main() {
  const conn = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
  
  console.log('Initial state: 30 SOL virtual / 1B tokens\n');
  
  for (const token of tokens) {
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), new PublicKey(token.mint).toBuffer()],
      PROGRAM_ID
    );
    
    const account = await conn.getAccountInfo(bondingCurve);
    if (!account) continue;
    
    const data = account.data;
    let offset = 8 + 32 + 32; // skip discriminator, mint, creator
    
    const virtualSol = Number(data.readBigUInt64LE(offset)) / LAMPORTS_PER_SOL;
    offset += 8;
    const virtualTokenRaw = Number(data.readBigUInt64LE(offset));
    const virtualToken = virtualTokenRaw / Math.pow(10, TOKEN_DECIMALS);
    offset += 8;
    const realSol = Number(data.readBigUInt64LE(offset)) / LAMPORTS_PER_SOL;
    offset += 8;
    const realTokenRaw = Number(data.readBigUInt64LE(offset));
    const realToken = realTokenRaw / Math.pow(10, TOKEN_DECIMALS);
    
    const tokensBought = TOTAL_SUPPLY - realToken;
    
    console.log(`=== ${token.name} ===`);
    console.log(`  Virtual: ${virtualSol.toFixed(4)} SOL / ${virtualToken.toLocaleString()} tokens`);
    console.log(`  Real: ${realSol.toFixed(6)} SOL / ${realToken.toLocaleString()} tokens`);
    console.log(`  Total SOL in: ${realSol.toFixed(6)}`);
    console.log(`  Total tokens bought: ${tokensBought.toLocaleString()} (${(tokensBought/TOTAL_SUPPLY*100).toFixed(2)}% supply)\n`);
  }
}

main();
