/**
 * Set Migration Operator
 * 
 * Sets the migration operator wallet that can trigger migrations.
 * Must be run by the protocol authority.
 * 
 * Usage: 
 *   npx tsx scripts/set-migration-operator.ts <operator_pubkey>
 *   MAINNET=1 npx tsx scripts/set-migration-operator.ts <operator_pubkey>
 */

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  clusterApiUrl, 
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as crypto from 'crypto';

const PROGRAM_ID = new PublicKey('GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM');

// Get connection based on env
const isMainnet = process.env.MAINNET === '1';
const rpcUrl = isMainnet 
  ? (process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')
  : clusterApiUrl('devnet');
const connection = new Connection(rpcUrl, 'confirmed');

console.log(`Network: ${isMainnet ? 'MAINNET' : 'devnet'}`);
console.log(`RPC: ${rpcUrl}`);

// Load authority wallet
const walletPath = process.env.WALLET_PATH || process.env.HOME + '/.config/solana/claw-wallet.json';
const authority = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
);

console.log('Authority wallet:', authority.publicKey.toBase58());

// Compute discriminator
function getDiscriminator(name: string): Buffer {
  return crypto.createHash('sha256').update(`global:${name}`).digest().slice(0, 8);
}

async function main() {
  const operatorArg = process.argv[2];
  
  if (!operatorArg) {
    console.log('\nUsage: npx tsx scripts/set-migration-operator.ts <operator_pubkey>');
    console.log('\nTo generate a new operator wallet:');
    console.log('  solana-keygen new -o ~/.config/solana/operator-wallet.json');
    console.log('  solana address -k ~/.config/solana/operator-wallet.json');
    return;
  }

  const newOperator = new PublicKey(operatorArg);
  console.log('New operator:', newOperator.toBase58());

  // Find config PDA
  const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  console.log('Config PDA:', configPDA.toBase58());

  // Check current config
  const configAccount = await connection.getAccountInfo(configPDA);
  if (!configAccount) {
    console.error('❌ Config not found! Protocol may not be initialized.');
    return;
  }

  // Parse current values (authority at offset 8, fee_recipient at 40, migration_operator at 72)
  const currentAuthority = new PublicKey(configAccount.data.slice(8, 40));
  const currentOperator = configAccount.data.length >= 104 
    ? new PublicKey(configAccount.data.slice(72, 104))
    : currentAuthority;  // Old config without operator field

  console.log('\nCurrent on-chain state:');
  console.log('  Authority:', currentAuthority.toBase58());
  console.log('  Migration operator:', currentOperator.toBase58());

  if (!currentAuthority.equals(authority.publicKey)) {
    console.error('\n❌ Your wallet is not the authority!');
    console.error(`   Your wallet: ${authority.publicKey.toBase58()}`);
    console.error(`   On-chain authority: ${currentAuthority.toBase58()}`);
    return;
  }

  if (currentOperator.equals(newOperator)) {
    console.log('\n⚠️ New operator is same as current operator. Nothing to do.');
    return;
  }

  console.log('\n📝 Setting migration operator...');
  console.log(`   From: ${currentOperator.toBase58()}`);
  console.log(`   To:   ${newOperator.toBase58()}`);

  // Build transaction
  const discriminator = getDiscriminator('set_migration_operator');
  console.log('Discriminator:', discriminator.toString('hex'));

  const data = Buffer.concat([
    discriminator,
    newOperator.toBuffer(),
  ]);

  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
      { pubkey: configPDA, isSigner: false, isWritable: true },
    ],
    data,
  });

  const tx = new Transaction().add(instruction);
  tx.feePayer = authority.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  console.log('\n📤 Sending transaction...');
  const signature = await sendAndConfirmTransaction(connection, tx, [authority]);
  console.log('✅ Migration operator set!');
  console.log('   Signature:', signature);

  // Verify
  const updatedConfig = await connection.getAccountInfo(configPDA);
  if (updatedConfig && updatedConfig.data.length >= 104) {
    const verifyOperator = new PublicKey(updatedConfig.data.slice(72, 104));
    console.log('\n✅ Verified new operator:', verifyOperator.toBase58());
  }

  console.log('\n📋 Next steps:');
  console.log('1. Fund the operator wallet with ~0.5 SOL');
  console.log('2. Add OPERATOR_WALLET_PRIVATE_KEY to Vercel env vars');
  console.log('3. The operator can now trigger migrations');
}

main().catch(console.error);
