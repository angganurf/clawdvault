/**
 * Test Graduation Flow on Devnet
 * 
 * Prerequisites:
 * 1. Deploy updated program to devnet: anchor deploy --provider.cluster devnet
 * 2. Have a token created (can use existing or create new)
 * 
 * Usage: npx tsx scripts/test-graduation.ts [mint]
 */

import { Connection, PublicKey, Keypair, clusterApiUrl, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import * as fs from 'fs';
import ClawdVaultClient, { findBondingCurvePDA, findConfigPDA } from '../app/src/lib/anchor/client';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Load authority wallet
const walletPath = process.env.HOME + '/.config/solana/claw-wallet.json';
const authority = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
);
console.log('Authority:', authority.publicKey.toBase58());

async function main() {
  const mintArg = process.argv[2];
  
  if (!mintArg) {
    // List existing tokens
    console.log('\nFetching existing bonding curves...\n');
    
    const PROGRAM_ID = new PublicKey('GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM');
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: 123 }],
    });
    
    if (accounts.length === 0) {
      console.log('No tokens found on devnet. Create one first:');
      console.log('  1. Go to https://clawdvault.com (with devnet config)');
      console.log('  2. Create a token');
      console.log('  3. Run this script with the mint address');
      return;
    }
    
    console.log('Available tokens:');
    for (const { account } of accounts) {
      const data = account.data;
      const mint = new PublicKey(data.slice(40, 72)).toBase58();
      const realSol = Number(data.readBigUInt64LE(88)) / 1e9;
      const graduated = data[112] === 1;
      console.log(`  ${mint} - ${realSol.toFixed(4)} SOL ${graduated ? '✅ GRADUATED' : ''}`);
    }
    console.log('\nUsage: npx tsx scripts/test-graduation.ts <mint>');
    return;
  }
  
  const mint = new PublicKey(mintArg);
  console.log('\nTesting graduation for:', mint.toBase58());
  
  const client = new ClawdVaultClient(connection);
  const [curvePDA] = findBondingCurvePDA(mint);
  
  // Check current state
  const curveAccount = await connection.getAccountInfo(curvePDA);
  if (!curveAccount) {
    console.error('❌ Bonding curve not found!');
    return;
  }
  
  const data = curveAccount.data;
  const graduated = data[112] === 1;
  const migrated = data.length > 113 ? data[113] === 1 : false;
  const realSol = Number(data.readBigUInt64LE(88)) / 1e9;
  
  console.log('Current state:');
  console.log('  Graduated:', graduated);
  console.log('  Migrated:', migrated);
  console.log('  SOL reserves:', realSol);
  
  // Step 1: Force graduate if not already
  if (!graduated) {
    console.log('\n📝 Step 1: Force graduating token...');
    
    const forceGradTx = await client.buildForceGraduateTx(authority.publicKey, mint);
    const sig1 = await sendAndConfirmTransaction(connection, forceGradTx, [authority]);
    console.log('✅ Force graduated:', sig1);
    
    // Verify
    const updated = await connection.getAccountInfo(curvePDA);
    if (updated && updated.data[112] === 1) {
      console.log('✅ Graduation confirmed on-chain!');
    }
  } else {
    console.log('\n✅ Token already graduated, skipping step 1');
  }
  
  // Step 2: Create migration wallet token account
  console.log('\n📝 Step 2: Ensuring migration token account exists...');
  
  const migrationTokenAccount = await getAssociatedTokenAddress(mint, authority.publicKey);
  try {
    await getAccount(connection, migrationTokenAccount);
    console.log('✅ Token account exists');
  } catch {
    console.log('Creating token account...');
    const createAtaIx = createAssociatedTokenAccountInstruction(
      authority.publicKey,
      migrationTokenAccount,
      authority.publicKey,
      mint
    );
    const tx = new (await import('@solana/web3.js')).Transaction().add(createAtaIx);
    tx.feePayer = authority.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
    console.log('✅ Created:', sig);
  }
  
  // Step 3: Release assets for migration
  console.log('\n📝 Step 3: Releasing assets for migration...');
  
  const releaseTx = await client.buildReleaseForMigrationTx(
    authority.publicKey,
    mint,
    authority.publicKey // Using same wallet for simplicity
  );
  
  try {
    const sig3 = await sendAndConfirmTransaction(connection, releaseTx, [authority]);
    console.log('✅ Assets released:', sig3);
  } catch (err: any) {
    if (err.message?.includes('AlreadyMigrated')) {
      console.log('⚠️ Token already migrated');
    } else {
      throw err;
    }
  }
  
  // Step 4: Create Raydium pool (optional - requires Raydium SDK)
  console.log('\n📝 Step 4: Raydium pool creation...');
  console.log('⚠️ Skipping - run /api/graduate endpoint for full flow with Raydium');
  
  console.log('\n✅ Test complete!');
  console.log('\nTo test full Raydium integration:');
  console.log(`  curl -X POST http://localhost:3000/api/graduate -H "Content-Type: application/json" -d '{"mint": "${mint.toBase58()}"}'`);
}

main().catch(console.error);
