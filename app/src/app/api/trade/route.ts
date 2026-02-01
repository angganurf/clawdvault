import { NextResponse } from 'next/server';
import { executeTrade, getToken } from '@/lib/db';
import { TradeRequest, TradeResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || 'anonymous';
    
    const body: TradeRequest = await request.json();
    
    // Validate required fields
    if (!body.mint || !body.type || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Mint, type, and amount are required' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (body.type !== 'buy' && body.type !== 'sell') {
      return NextResponse.json(
        { success: false, error: 'Type must be "buy" or "sell"' },
        { status: 400 }
      );
    }
    
    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be positive' },
        { status: 400 }
      );
    }
    
    // Check token exists
    const token = await getToken(body.mint);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }
    
    // Check not graduated
    if (token.graduated) {
      return NextResponse.json(
        { success: false, error: 'Token has graduated to Raydium' },
        { status: 400 }
      );
    }
    
    // Execute trade
    const result = await executeTrade(
      body.mint,
      body.type,
      body.amount,
      apiKey
    );
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Trade failed' },
        { status: 500 }
      );
    }
    
    const response: TradeResponse = {
      success: true,
      trade: result.trade,
      signature: result.trade.signature,
      tokens_received: body.type === 'buy' ? result.trade.token_amount : undefined,
      sol_received: body.type === 'sell' ? result.trade.sol_amount : undefined,
      new_price: result.token.price_sol,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error executing trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute trade' },
      { status: 500 }
    );
  }
}

// Get quote without executing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get('mint');
    const type = searchParams.get('type') as 'buy' | 'sell';
    const amount = parseFloat(searchParams.get('amount') || '0');
    
    if (!mint || !type || !amount) {
      return NextResponse.json(
        { error: 'Mint, type, and amount are required' },
        { status: 400 }
      );
    }
    
    const token = await getToken(mint);
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }
    
    let output: number;
    let priceImpact: number;
    
    if (type === 'buy') {
      const newVirtualSol = token.virtual_sol_reserves + amount;
      const invariant = token.virtual_sol_reserves * token.virtual_token_reserves;
      const newVirtualTokens = invariant / newVirtualSol;
      output = token.virtual_token_reserves - newVirtualTokens;
      
      const newPrice = newVirtualSol / newVirtualTokens;
      priceImpact = ((newPrice - token.price_sol) / token.price_sol) * 100;
    } else {
      const newVirtualTokens = token.virtual_token_reserves + amount;
      const invariant = token.virtual_sol_reserves * token.virtual_token_reserves;
      const newVirtualSol = invariant / newVirtualTokens;
      output = token.virtual_sol_reserves - newVirtualSol;
      output *= 0.99;  // Apply 1% fee
      
      const newPrice = newVirtualSol / newVirtualTokens;
      priceImpact = ((token.price_sol - newPrice) / token.price_sol) * 100;
    }
    
    return NextResponse.json({
      input: amount,
      output,
      price_impact: priceImpact,
      fee: type === 'buy' ? amount * 0.01 : output * 0.01,
      current_price: token.price_sol,
    });
  } catch (error) {
    console.error('Error getting quote:', error);
    return NextResponse.json(
      { error: 'Failed to get quote' },
      { status: 500 }
    );
  }
}
