use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("C1awdVauXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

// Constants
pub const GRADUATION_THRESHOLD: u64 = 69_000_000_000; // ~$69K in lamports
pub const FEE_BPS: u64 = 100; // 1% fee (100 basis points)
pub const INITIAL_VIRTUAL_SOL: u64 = 30_000_000_000; // 30 SOL virtual liquidity
pub const INITIAL_VIRTUAL_TOKENS: u64 = 1_073_000_000_000_000; // 1.073B tokens

#[program]
pub mod clawdvault {
    use super::*;

    /// Create a new token with bonding curve
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        curve.creator = ctx.accounts.creator.key();
        curve.mint = ctx.accounts.mint.key();
        curve.virtual_sol_reserves = INITIAL_VIRTUAL_SOL;
        curve.virtual_token_reserves = INITIAL_VIRTUAL_TOKENS;
        curve.real_sol_reserves = 0;
        curve.real_token_reserves = INITIAL_VIRTUAL_TOKENS;
        curve.token_total_supply = INITIAL_VIRTUAL_TOKENS;
        curve.graduated = false;
        curve.bump = ctx.bumps.bonding_curve;
        
        msg!("Token created: {} ({})", name, symbol);
        msg!("Creator: {}", curve.creator);
        
        Ok(())
    }

    /// Buy tokens from bonding curve
    pub fn buy(ctx: Context<Buy>, sol_amount: u64, min_tokens_out: u64) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        require!(!curve.graduated, ClawdVaultError::AlreadyGraduated);
        
        // Calculate tokens out using constant product formula
        // tokens_out = virtual_token_reserves - (virtual_sol_reserves * virtual_token_reserves) / (virtual_sol_reserves + sol_amount)
        let new_virtual_sol = curve.virtual_sol_reserves.checked_add(sol_amount)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let invariant = curve.virtual_sol_reserves
            .checked_mul(curve.virtual_token_reserves)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let new_virtual_tokens = invariant
            .checked_div(new_virtual_sol)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let tokens_out = curve.virtual_token_reserves
            .checked_sub(new_virtual_tokens)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        require!(tokens_out >= min_tokens_out, ClawdVaultError::SlippageExceeded);
        
        // Calculate fee
        let fee = sol_amount
            .checked_mul(FEE_BPS)
            .ok_or(ClawdVaultError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let sol_after_fee = sol_amount.checked_sub(fee)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        // Update curve state
        curve.virtual_sol_reserves = new_virtual_sol;
        curve.virtual_token_reserves = new_virtual_tokens;
        curve.real_sol_reserves = curve.real_sol_reserves
            .checked_add(sol_after_fee)
            .ok_or(ClawdVaultError::MathOverflow)?;
        curve.real_token_reserves = curve.real_token_reserves
            .checked_sub(tokens_out)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        // Check for graduation
        if curve.real_sol_reserves >= GRADUATION_THRESHOLD {
            curve.graduated = true;
            msg!("🎓 Token graduated! Ready for Raydium migration");
        }
        
        msg!("Buy: {} SOL -> {} tokens", sol_amount, tokens_out);
        
        // TODO: Transfer SOL and tokens
        
        Ok(())
    }

    /// Sell tokens back to bonding curve
    pub fn sell(ctx: Context<Sell>, token_amount: u64, min_sol_out: u64) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        require!(!curve.graduated, ClawdVaultError::AlreadyGraduated);
        
        // Calculate SOL out using constant product formula
        let new_virtual_tokens = curve.virtual_token_reserves
            .checked_add(token_amount)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let invariant = curve.virtual_sol_reserves
            .checked_mul(curve.virtual_token_reserves)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let new_virtual_sol = invariant
            .checked_div(new_virtual_tokens)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let sol_out = curve.virtual_sol_reserves
            .checked_sub(new_virtual_sol)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        // Calculate fee
        let fee = sol_out
            .checked_mul(FEE_BPS)
            .ok_or(ClawdVaultError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        let sol_after_fee = sol_out.checked_sub(fee)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        require!(sol_after_fee >= min_sol_out, ClawdVaultError::SlippageExceeded);
        
        // Update curve state
        curve.virtual_sol_reserves = new_virtual_sol;
        curve.virtual_token_reserves = new_virtual_tokens;
        curve.real_sol_reserves = curve.real_sol_reserves
            .checked_sub(sol_after_fee)
            .ok_or(ClawdVaultError::MathOverflow)?;
        curve.real_token_reserves = curve.real_token_reserves
            .checked_add(token_amount)
            .ok_or(ClawdVaultError::MathOverflow)?;
        
        msg!("Sell: {} tokens -> {} SOL", token_amount, sol_after_fee);
        
        // TODO: Transfer SOL and tokens
        
        Ok(())
    }
}

// Account structures

#[account]
pub struct BondingCurve {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub token_total_supply: u64,
    pub graduated: bool,
    pub bump: u8,
}

impl BondingCurve {
    pub const LEN: usize = 8 + // discriminator
        32 + // creator
        32 + // mint
        8 + // virtual_sol_reserves
        8 + // virtual_token_reserves
        8 + // real_sol_reserves
        8 + // real_token_reserves
        8 + // token_total_supply
        1 + // graduated
        1; // bump
}

// Context structures

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = bonding_curve,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = creator,
        space = BondingCurve::LEN,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bonding_curve", bonding_curve.mint.as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    // TODO: Add token accounts, fee account, etc.
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bonding_curve", bonding_curve.mint.as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    // TODO: Add token accounts, fee account, etc.
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Errors

#[error_code]
pub enum ClawdVaultError {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Token has already graduated to Raydium")]
    AlreadyGraduated,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
