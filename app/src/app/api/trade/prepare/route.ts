import { NextResponse } from 'next/server';
import { getToken } from '@/lib/db';
import { 
  createBuyTransaction, 
  createSellTransaction, 
  isMockMode,
  getPlatformWalletPubkey 
} from '@/lib/solana';

export const dynamic = 'force-dynamic';

interface PrepareTradeRequest {
  mint: string;
  type: 'buy' | 'sell';
  amount: number;      // SOL for buy, tokens for sell
  wallet: string;      // User's wallet address
  slippage?: number;   // Slippage tolerance (default 1%)
}

/**
 * Prepare a trade transaction for the user to sign
 * POST /api/trade/prepare
 */
export async function POST(request: Request) {
  try {
    // Check if we're in mock mode
    if (isMockMode()) {
      return NextResponse.json({
        success: false,
        error: 'On-chain trading not configured. Use /api/trade for mock trades.',
        mockMode: true,
      }, { status: 400 });
    }

    const body: PrepareTradeRequest = await request.json();
    
    // Validate
    if (!body.mint || !body.type || !body.amount || !body.wallet) {
      return NextResponse.json(
        { success: false, error: 'mint, type, amount, and wallet are required' },
        { status: 400 }
      );
    }

    if (body.type !== 'buy' && body.type !== 'sell') {
      return NextResponse.json(
        { success: false, error: 'type must be "buy" or "sell"' },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount must be positive' },
        { status: 400 }
      );
    }

    // Get token
    const token = await getToken(body.mint);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }

    if (token.graduated) {
      return NextResponse.json(
        { success: false, error: 'Token has graduated to Raydium' },
        { status: 400 }
      );
    }

    const slippage = body.slippage || 0.01; // 1% default
    
    // Calculate expected output using bonding curve
    let expectedOutput: number;
    let priceImpact: number;
    
    if (body.type === 'buy') {
      // Buying: spending SOL, receiving tokens
      const solAmount = body.amount;
      const feeAmount = solAmount * 0.01; // 1% fee
      const solToTrade = solAmount - feeAmount;
      
      const newVirtualSol = token.virtual_sol_reserves + solToTrade;
      const invariant = token.virtual_sol_reserves * token.virtual_token_reserves;
      const newVirtualTokens = invariant / newVirtualSol;
      expectedOutput = token.virtual_token_reserves - newVirtualTokens;
      
      const newPrice = newVirtualSol / newVirtualTokens;
      priceImpact = ((newPrice - token.price_sol) / token.price_sol) * 100;
      
      // Apply slippage to get minimum
      const minTokensOut = expectedOutput * (1 - slippage);
      
      const { transaction } = await createBuyTransaction({
        mint: body.mint,
        buyer: body.wallet,
        solAmount: body.amount,
        minTokensOut,
        creatorWallet: token.creator,
      });
      
      return NextResponse.json({
        success: true,
        transaction,
        type: 'buy',
        input: {
          sol: body.amount,
          fee: feeAmount,
        },
        output: {
          tokens: expectedOutput,
          minTokens: minTokensOut,
        },
        priceImpact,
        currentPrice: token.price_sol,
        newPrice: newVirtualSol / newVirtualTokens,
        platformWallet: getPlatformWalletPubkey(),
      });
      
    } else {
      // Selling: spending tokens, receiving SOL
      const tokenAmount = body.amount;
      
      const newVirtualTokens = token.virtual_token_reserves + tokenAmount;
      const invariant = token.virtual_sol_reserves * token.virtual_token_reserves;
      const newVirtualSol = invariant / newVirtualTokens;
      const solBeforeFee = token.virtual_sol_reserves - newVirtualSol;
      
      const feeAmount = solBeforeFee * 0.01; // 1% fee
      expectedOutput = solBeforeFee - feeAmount;
      
      const newPrice = newVirtualSol / newVirtualTokens;
      priceImpact = ((token.price_sol - newPrice) / token.price_sol) * 100;
      
      // Apply slippage
      const minSolOut = expectedOutput * (1 - slippage);
      
      const { transaction } = await createSellTransaction({
        mint: body.mint,
        seller: body.wallet,
        tokenAmount: body.amount,
        minSolOut,
        creatorWallet: token.creator,
      });
      
      return NextResponse.json({
        success: true,
        transaction,
        type: 'sell',
        input: {
          tokens: body.amount,
        },
        output: {
          sol: expectedOutput,
          minSol: minSolOut,
          fee: feeAmount,
        },
        priceImpact,
        currentPrice: token.price_sol,
        newPrice: newVirtualSol / newVirtualTokens,
        platformWallet: getPlatformWalletPubkey(),
      });
    }
    
  } catch (error) {
    console.error('Error preparing trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to prepare trade' },
      { status: 500 }
    );
  }
}
