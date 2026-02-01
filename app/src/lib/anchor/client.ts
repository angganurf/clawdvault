/**
 * ClawdVault Anchor Client
 * 
 * TypeScript client for interacting with the ClawdVault on-chain program.
 * Non-custodial bonding curve trading - users sign their own transactions.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { BN } from 'bn.js';

// Program ID - update after deployment
export const PROGRAM_ID = new PublicKey('C1awdVau1tXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

// Seeds
const CONFIG_SEED = Buffer.from('config');
const CURVE_SEED = Buffer.from('bonding_curve');
const VAULT_SEED = Buffer.from('sol_vault');
const TOKEN_VAULT_SEED = Buffer.from('token_vault');

// Constants matching the program
export const TOTAL_SUPPLY = new BN('1000000000000000'); // 1B * 10^6
export const INITIAL_VIRTUAL_SOL = new BN('30000000000'); // 30 SOL
export const INITIAL_VIRTUAL_TOKENS = TOTAL_SUPPLY;
export const GRADUATION_THRESHOLD = new BN('120000000000'); // 120 SOL
export const PROTOCOL_FEE_BPS = 50;
export const CREATOR_FEE_BPS = 50;
export const TOTAL_FEE_BPS = 100;

/**
 * Find the config PDA
 */
export function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
}

/**
 * Find the bonding curve PDA for a mint
 */
export function findBondingCurvePDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CURVE_SEED, mint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Find the SOL vault PDA for a mint
 */
export function findSolVaultPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, mint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Find the token vault address (ATA of bonding curve)
 */
export async function findTokenVaultAddress(
  mint: PublicKey,
  bondingCurve: PublicKey
): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, bondingCurve, true);
}

/**
 * Bonding curve state
 */
export interface BondingCurveState {
  creator: PublicKey;
  mint: PublicKey;
  virtualSolReserves: BN;
  virtualTokenReserves: BN;
  realSolReserves: BN;
  realTokenReserves: BN;
  tokenTotalSupply: BN;
  graduated: boolean;
  createdAt: BN;
  bump: number;
  solVaultBump: number;
  tokenVaultBump: number;
}

/**
 * Calculate tokens out for a buy
 */
export function calculateBuyTokensOut(
  solAmount: BN,
  virtualSolReserves: BN,
  virtualTokenReserves: BN
): { tokensOut: BN; priceImpact: number } {
  const newVirtualSol = virtualSolReserves.add(solAmount);
  const invariant = virtualSolReserves.mul(virtualTokenReserves);
  const newVirtualTokens = invariant.div(newVirtualSol);
  const tokensOut = virtualTokenReserves.sub(newVirtualTokens);
  
  // Calculate price impact
  const spotPrice = virtualSolReserves.toNumber() / virtualTokenReserves.toNumber();
  const avgPrice = solAmount.toNumber() / tokensOut.toNumber();
  const priceImpact = ((avgPrice - spotPrice) / spotPrice) * 100;
  
  return { tokensOut, priceImpact };
}

/**
 * Calculate SOL out for a sell
 */
export function calculateSellSolOut(
  tokenAmount: BN,
  virtualSolReserves: BN,
  virtualTokenReserves: BN
): { solOut: BN; priceImpact: number } {
  const newVirtualTokens = virtualTokenReserves.add(tokenAmount);
  const invariant = virtualSolReserves.mul(virtualTokenReserves);
  const newVirtualSol = invariant.div(newVirtualTokens);
  const solOutGross = virtualSolReserves.sub(newVirtualSol);
  
  // Apply fee
  const fee = solOutGross.mul(new BN(TOTAL_FEE_BPS)).div(new BN(10000));
  const solOut = solOutGross.sub(fee);
  
  // Calculate price impact
  const spotPrice = virtualSolReserves.toNumber() / virtualTokenReserves.toNumber();
  const avgPrice = solOutGross.toNumber() / tokenAmount.toNumber();
  const priceImpact = ((spotPrice - avgPrice) / spotPrice) * 100;
  
  return { solOut, priceImpact };
}

/**
 * Calculate current token price in SOL
 */
export function calculatePrice(
  virtualSolReserves: BN,
  virtualTokenReserves: BN
): number {
  return virtualSolReserves.toNumber() / virtualTokenReserves.toNumber();
}

/**
 * Calculate market cap in SOL
 */
export function calculateMarketCap(
  virtualSolReserves: BN,
  virtualTokenReserves: BN,
  totalSupply: BN
): number {
  const price = calculatePrice(virtualSolReserves, virtualTokenReserves);
  return price * totalSupply.toNumber();
}

/**
 * ClawdVault client for building transactions
 */
export class ClawdVaultClient {
  connection: Connection;
  
  constructor(connection: Connection) {
    this.connection = connection;
  }
  
  /**
   * Fetch bonding curve state
   */
  async getBondingCurve(mint: PublicKey): Promise<BondingCurveState | null> {
    const [curvePDA] = findBondingCurvePDA(mint);
    const account = await this.connection.getAccountInfo(curvePDA);
    
    if (!account) return null;
    
    // Decode the account data
    // Skip 8-byte discriminator
    const data = account.data.slice(8);
    
    return {
      creator: new PublicKey(data.slice(0, 32)),
      mint: new PublicKey(data.slice(32, 64)),
      virtualSolReserves: new BN(data.slice(64, 72), 'le'),
      virtualTokenReserves: new BN(data.slice(72, 80), 'le'),
      realSolReserves: new BN(data.slice(80, 88), 'le'),
      realTokenReserves: new BN(data.slice(88, 96), 'le'),
      tokenTotalSupply: new BN(data.slice(96, 104), 'le'),
      graduated: data[104] === 1,
      createdAt: new BN(data.slice(105, 113), 'le'),
      bump: data[113],
      solVaultBump: data[114],
      tokenVaultBump: data[115],
    };
  }
  
  /**
   * Build a buy transaction
   */
  async buildBuyTransaction(
    buyer: PublicKey,
    mint: PublicKey,
    solAmount: BN,
    minTokensOut: BN,
    creator: PublicKey,
    feeRecipient: PublicKey
  ): Promise<Transaction> {
    const [configPDA] = findConfigPDA();
    const [curvePDA] = findBondingCurvePDA(mint);
    const [solVaultPDA] = findSolVaultPDA(mint);
    const tokenVault = await findTokenVaultAddress(mint, curvePDA);
    const buyerTokenAccount = await getAssociatedTokenAddress(mint, buyer);
    
    // Build instruction data
    // Discriminator for "buy" (8 bytes) + sol_amount (8) + min_tokens_out (8)
    const discriminator = Buffer.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]); // anchor discriminator for "buy"
    const data = Buffer.concat([
      discriminator,
      solAmount.toArrayLike(Buffer, 'le', 8),
      minTokensOut.toArrayLike(Buffer, 'le', 8),
    ]);
    
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: curvePDA, isSigner: false, isWritable: true },
        { pubkey: configPDA, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: solVaultPDA, isSigner: false, isWritable: true },
        { pubkey: tokenVault, isSigner: false, isWritable: true },
        { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: feeRecipient, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
    
    const tx = new Transaction().add(instruction);
    tx.feePayer = buyer;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    
    return tx;
  }
  
  /**
   * Build a sell transaction
   */
  async buildSellTransaction(
    seller: PublicKey,
    mint: PublicKey,
    tokenAmount: BN,
    minSolOut: BN,
    creator: PublicKey,
    feeRecipient: PublicKey
  ): Promise<Transaction> {
    const [configPDA] = findConfigPDA();
    const [curvePDA] = findBondingCurvePDA(mint);
    const [solVaultPDA] = findSolVaultPDA(mint);
    const tokenVault = await findTokenVaultAddress(mint, curvePDA);
    const sellerTokenAccount = await getAssociatedTokenAddress(mint, seller);
    
    // Build instruction data
    const discriminator = Buffer.from([0xb4, 0x4b, 0x17, 0x0b, 0xe6, 0x1a, 0x59, 0x73]); // anchor discriminator for "sell"
    const data = Buffer.concat([
      discriminator,
      tokenAmount.toArrayLike(Buffer, 'le', 8),
      minSolOut.toArrayLike(Buffer, 'le', 8),
    ]);
    
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: curvePDA, isSigner: false, isWritable: true },
        { pubkey: configPDA, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: solVaultPDA, isSigner: false, isWritable: true },
        { pubkey: tokenVault, isSigner: false, isWritable: true },
        { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: feeRecipient, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
    
    const tx = new Transaction().add(instruction);
    tx.feePayer = seller;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    
    return tx;
  }
}

export default ClawdVaultClient;
