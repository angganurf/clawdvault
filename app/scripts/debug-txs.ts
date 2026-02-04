import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM');
const TRADE_DISCRIMINATOR = Buffer.from([189, 219, 127, 211, 78, 230, 97, 238]);
const CREATE_DISCRIMINATOR = Buffer.from([96, 122, 113, 138, 50, 227, 149, 57]);

const tokens = [
  { name: 'ClawdVault', mint: 'B7KpChn4dxioeuNzzEY9eioUwEi5xt5KYegytRottJgZ' },
  { name: 'Shadow Wolf', mint: 'HBcnWuDkZAPZ3qSUy6e8UkPZM3cCvs72DmYZavCaBaeM' },
  { name: 'Crab', mint: 'UUELtRkR5C6Yd5qq5sZoWztFEFe6V73VbuYYXEqoQiQ' },
];

async function main() {
  const conn = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
  
  for (const token of tokens) {
    console.log(`\n=== ${token.name} ===`);
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), new PublicKey(token.mint).toBuffer()],
      PROGRAM_ID
    );
    
    const sigs = await conn.getSignaturesForAddress(bondingCurve, { limit: 10 });
    
    for (const sig of sigs) {
      const tx = await conn.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
      if (!tx?.meta?.logMessages) continue;
      
      let hasCreate = false, hasTrade = false;
      for (const log of tx.meta.logMessages) {
        if (log.startsWith('Program data: ')) {
          const data = Buffer.from(log.slice('Program data: '.length), 'base64');
          if (data.slice(0, 8).equals(CREATE_DISCRIMINATOR)) hasCreate = true;
          if (data.slice(0, 8).equals(TRADE_DISCRIMINATOR)) hasTrade = true;
        }
      }
      console.log(`  ${sig.signature.slice(0,20)}... CREATE:${hasCreate} TRADE:${hasTrade}`);
    }
  }
}

main();
