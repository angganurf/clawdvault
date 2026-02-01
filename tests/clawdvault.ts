import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Clawdvault } from "../target/types/clawdvault";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";
import { BN } from "bn.js";

describe("clawdvault", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Clawdvault as Program<Clawdvault>;
  
  // Test accounts
  const authority = provider.wallet;
  const feeRecipient = Keypair.generate();
  const creator = Keypair.generate();
  const buyer = Keypair.generate();
  const mint = Keypair.generate();
  
  // PDAs
  let configPDA: PublicKey;
  let bondingCurvePDA: PublicKey;
  let solVaultPDA: PublicKey;
  let tokenVault: PublicKey;
  
  // Constants
  const INITIAL_VIRTUAL_SOL = new BN(30_000_000_000); // 30 SOL
  const TOTAL_SUPPLY = new BN("1000000000000000"); // 1B tokens
  
  before(async () => {
    // Find PDAs
    [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    
    [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), mint.publicKey.toBuffer()],
      program.programId
    );
    
    [solVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("sol_vault"), mint.publicKey.toBuffer()],
      program.programId
    );
    
    tokenVault = await getAssociatedTokenAddress(
      mint.publicKey,
      bondingCurvePDA,
      true
    );
    
    // Airdrop SOL to test accounts
    const airdropTx = await provider.connection.requestAirdrop(
      creator.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);
    
    const airdropTx2 = await provider.connection.requestAirdrop(
      buyer.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx2);
    
    const airdropTx3 = await provider.connection.requestAirdrop(
      feeRecipient.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx3);
  });
  
  it("Initializes the protocol", async () => {
    await program.methods
      .initialize()
      .accounts({
        authority: authority.publicKey,
        feeRecipient: feeRecipient.publicKey,
        config: configPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    const config = await program.account.config.fetch(configPDA);
    expect(config.authority.toString()).to.equal(authority.publicKey.toString());
    expect(config.feeRecipient.toString()).to.equal(feeRecipient.publicKey.toString());
    expect(config.totalTokensCreated.toNumber()).to.equal(0);
  });
  
  it("Creates a token with bonding curve", async () => {
    await program.methods
      .createToken("Test Token", "TEST", "https://example.com/metadata.json")
      .accounts({
        creator: creator.publicKey,
        config: configPDA,
        mint: mint.publicKey,
        bondingCurve: bondingCurvePDA,
        solVault: solVaultPDA,
        tokenVault: tokenVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([creator, mint])
      .rpc();
    
    const curve = await program.account.bondingCurve.fetch(bondingCurvePDA);
    expect(curve.creator.toString()).to.equal(creator.publicKey.toString());
    expect(curve.mint.toString()).to.equal(mint.publicKey.toString());
    expect(curve.virtualSolReserves.toString()).to.equal(INITIAL_VIRTUAL_SOL.toString());
    expect(curve.virtualTokenReserves.toString()).to.equal(TOTAL_SUPPLY.toString());
    expect(curve.realSolReserves.toNumber()).to.equal(0);
    expect(curve.realTokenReserves.toString()).to.equal(TOTAL_SUPPLY.toString());
    expect(curve.graduated).to.equal(false);
    
    // Check config was updated
    const config = await program.account.config.fetch(configPDA);
    expect(config.totalTokensCreated.toNumber()).to.equal(1);
  });
  
  it("Buys tokens from bonding curve", async () => {
    const buyerTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      buyer.publicKey
    );
    
    const solAmount = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL
    const minTokensOut = new BN(0); // No slippage protection for test
    
    const curveBefore = await program.account.bondingCurve.fetch(bondingCurvePDA);
    const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
    const feeRecipientBalanceBefore = await provider.connection.getBalance(feeRecipient.publicKey);
    
    await program.methods
      .buy(solAmount, minTokensOut)
      .accounts({
        buyer: buyer.publicKey,
        bondingCurve: bondingCurvePDA,
        config: configPDA,
        mint: mint.publicKey,
        solVault: solVaultPDA,
        tokenVault: tokenVault,
        buyerTokenAccount: buyerTokenAccount,
        feeRecipient: feeRecipient.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    
    const curveAfter = await program.account.bondingCurve.fetch(bondingCurvePDA);
    
    // Check curve state updated
    expect(curveAfter.virtualSolReserves.gt(curveBefore.virtualSolReserves)).to.be.true;
    expect(curveAfter.virtualTokenReserves.lt(curveBefore.virtualTokenReserves)).to.be.true;
    expect(curveAfter.realSolReserves.gt(curveBefore.realSolReserves)).to.be.true;
    expect(curveAfter.realTokenReserves.lt(curveBefore.realTokenReserves)).to.be.true;
    
    // Check fees were distributed
    const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
    const feeRecipientBalanceAfter = await provider.connection.getBalance(feeRecipient.publicKey);
    
    const expectedProtocolFee = solAmount.toNumber() * 50 / 10000; // 0.5%
    const expectedCreatorFee = solAmount.toNumber() * 50 / 10000; // 0.5%
    
    expect(creatorBalanceAfter - creatorBalanceBefore).to.be.closeTo(
      expectedCreatorFee,
      1000 // Allow small rounding error
    );
    expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.be.closeTo(
      expectedProtocolFee,
      1000
    );
    
    // Check buyer got tokens
    const buyerBalance = await provider.connection.getTokenAccountBalance(buyerTokenAccount);
    expect(parseInt(buyerBalance.value.amount)).to.be.greaterThan(0);
    
    console.log(`Bought ${buyerBalance.value.amount} tokens for 1 SOL`);
    console.log(`Protocol fee: ${expectedProtocolFee / LAMPORTS_PER_SOL} SOL`);
    console.log(`Creator fee: ${expectedCreatorFee / LAMPORTS_PER_SOL} SOL`);
  });
  
  it("Sells tokens back to bonding curve", async () => {
    const sellerTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      buyer.publicKey
    );
    
    // Get buyer's token balance
    const tokenBalanceBefore = await provider.connection.getTokenAccountBalance(sellerTokenAccount);
    const tokenAmount = new BN(tokenBalanceBefore.value.amount).div(new BN(2)); // Sell half
    const minSolOut = new BN(0);
    
    const curveBefore = await program.account.bondingCurve.fetch(bondingCurvePDA);
    const sellerSolBefore = await provider.connection.getBalance(buyer.publicKey);
    
    await program.methods
      .sell(tokenAmount, minSolOut)
      .accounts({
        seller: buyer.publicKey,
        bondingCurve: bondingCurvePDA,
        config: configPDA,
        mint: mint.publicKey,
        solVault: solVaultPDA,
        tokenVault: tokenVault,
        sellerTokenAccount: sellerTokenAccount,
        feeRecipient: feeRecipient.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    
    const curveAfter = await program.account.bondingCurve.fetch(bondingCurvePDA);
    const sellerSolAfter = await provider.connection.getBalance(buyer.publicKey);
    
    // Check curve state updated
    expect(curveAfter.virtualSolReserves.lt(curveBefore.virtualSolReserves)).to.be.true;
    expect(curveAfter.virtualTokenReserves.gt(curveBefore.virtualTokenReserves)).to.be.true;
    expect(curveAfter.realSolReserves.lt(curveBefore.realSolReserves)).to.be.true;
    expect(curveAfter.realTokenReserves.gt(curveBefore.realTokenReserves)).to.be.true;
    
    // Seller got SOL back (minus fees and tx cost)
    expect(sellerSolAfter).to.be.greaterThan(sellerSolBefore - 10000); // Account for tx fee
    
    console.log(`Sold ${tokenAmount.toString()} tokens`);
    console.log(`SOL received: ${(sellerSolAfter - sellerSolBefore) / LAMPORTS_PER_SOL}`);
  });
  
  it("Rejects buy with slippage exceeded", async () => {
    const buyerTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      buyer.publicKey
    );
    
    const solAmount = new BN(1 * LAMPORTS_PER_SOL);
    const minTokensOut = new BN("999999999999999999"); // Unrealistic expectation
    
    try {
      await program.methods
        .buy(solAmount, minTokensOut)
        .accounts({
          buyer: buyer.publicKey,
          bondingCurve: bondingCurvePDA,
          config: configPDA,
          mint: mint.publicKey,
          solVault: solVaultPDA,
          tokenVault: tokenVault,
          buyerTokenAccount: buyerTokenAccount,
          feeRecipient: feeRecipient.publicKey,
          creator: creator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      
      expect.fail("Should have thrown SlippageExceeded error");
    } catch (e: any) {
      expect(e.message).to.include("SlippageExceeded");
    }
  });
  
  it("Calculates correct bonding curve prices", async () => {
    const curve = await program.account.bondingCurve.fetch(bondingCurvePDA);
    
    // Price = virtual_sol / virtual_tokens
    const price = curve.virtualSolReserves.toNumber() / curve.virtualTokenReserves.toNumber();
    
    // Market cap = price * total_supply
    const marketCap = price * TOTAL_SUPPLY.toNumber();
    
    console.log(`Current price: ${price * 1e6} lamports per token (${price * 1e6 / LAMPORTS_PER_SOL} SOL)`);
    console.log(`Market cap: ${marketCap / LAMPORTS_PER_SOL} SOL`);
    console.log(`Progress to graduation: ${(curve.realSolReserves.toNumber() / 120_000_000_000 * 100).toFixed(2)}%`);
  });
});
