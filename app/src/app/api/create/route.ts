import { NextResponse } from 'next/server';
import { createToken, executeTrade } from '@/lib/db';
import { CreateTokenRequest, CreateTokenResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check API key (optional for now)
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || 'anonymous';
    
    const body: CreateTokenRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.symbol) {
      return NextResponse.json(
        { success: false, error: 'Name and symbol are required' },
        { status: 400 }
      );
    }
    
    // Validate symbol
    if (body.symbol.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Symbol must be 10 characters or less' },
        { status: 400 }
      );
    }
    
    // Validate name
    if (body.name.length > 32) {
      return NextResponse.json(
        { success: false, error: 'Name must be 32 characters or less' },
        { status: 400 }
      );
    }
    
    // Validate initialBuy
    if (body.initialBuy !== undefined) {
      if (body.initialBuy < 0) {
        return NextResponse.json(
          { success: false, error: 'Initial buy amount cannot be negative' },
          { status: 400 }
        );
      }
      if (body.initialBuy > 100) {
        return NextResponse.json(
          { success: false, error: 'Initial buy amount cannot exceed 100 SOL' },
          { status: 400 }
        );
      }
    }
    
    // Create token
    const token = await createToken({
      name: body.name,
      symbol: body.symbol,
      description: body.description,
      image: body.image,
      creator: apiKey,
      creator_name: apiKey === 'anonymous' ? 'Anonymous' : undefined,
      twitter: body.twitter,
      telegram: body.telegram,
      website: body.website,
    });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Failed to create token' },
        { status: 500 }
      );
    }
    
    // Execute initial buy if specified
    let initialBuyResult = null;
    if (body.initialBuy && body.initialBuy > 0) {
      try {
        initialBuyResult = await executeTrade(
          token.mint,
          'buy',
          body.initialBuy,
          apiKey  // Creator is the buyer
        );
      } catch (err) {
        console.error('Initial buy failed:', err);
        // Don't fail token creation if initial buy fails
      }
    }
    
    const response: CreateTokenResponse = {
      success: true,
      token: initialBuyResult?.token || token,  // Use updated token if initial buy happened
      mint: token.mint,
      signature: `mock_sig_${Date.now()}`,
    };
    
    // Add initial buy info to response
    if (initialBuyResult) {
      (response as any).initialBuy = {
        sol_spent: body.initialBuy,
        tokens_received: initialBuyResult.trade.token_amount,
      };
    }
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create token' },
      { status: 500 }
    );
  }
}
