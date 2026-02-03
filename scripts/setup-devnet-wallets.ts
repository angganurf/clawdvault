import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';

// Generate wallets
const migrationWallet = Keypair.generate();
const authorityWallet = Keypair.generate();

console.log('=== DEVNET WALLET SETUP ===\n');

console.log('MIGRATION WALLET:');
console.log(`  Public Key: ${migrationWallet.publicKey.toBase58()}`);
console.log(`  Private Key: ${bs58.encode(migrationWallet.secretKey)}`);

console.log('\nAUTHORITY WALLET:');
console.log(`  Public Key: ${authorityWallet.publicKey.toBase58()}`);
console.log(`  Private Key: ${bs58.encode(authorityWallet.secretKey)}`);

// Save to .env.local format
const envContent = `
# Devnet graduation wallets (generated ${new Date().toISOString()})
MIGRATION_WALLET_PRIVATE_KEY=${bs58.encode(migrationWallet.secretKey)}
AUTHORITY_WALLET_PRIVATE_KEY=${bs58.encode(authorityWallet.secretKey)}

# Public keys for reference
# MIGRATION_WALLET_PUBLIC_KEY=${migrationWallet.publicKey.toBase58()}
# AUTHORITY_WALLET_PUBLIC_KEY=${authorityWallet.publicKey.toBase58()}
`;

console.log('\n=== ENV VARS ===');
console.log(envContent);

console.log('\n=== NEXT STEPS ===');
console.log('1. Add these to your .env.local file');
console.log('2. Fund both wallets with devnet SOL:');
console.log(`   solana airdrop 2 ${migrationWallet.publicKey.toBase58()} --url devnet`);
console.log(`   solana airdrop 2 ${authorityWallet.publicKey.toBase58()} --url devnet`);
console.log('3. Initialize the protocol with authority wallet (if not done)');
