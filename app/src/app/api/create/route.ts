import { NextResponse } from 'next/server';
import { createToken, validateApiKey } from '@/lib/store';
import { CreateTokenRequest, CreateTokenResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    // Check API key (optional for testing)
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    // For production, require valid API key
    // if (!apiKey || !validateApiKey(apiKey)) {
    //   return NextResponse.json(
    //     { error: 'Invalid or missing API key' },
    //     { status: 401 }
    //   );
    // }
    
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
    
    // Create token
    const token = createToken({
      name: body.name,
      symbol: body.symbol,
      description: body.description,
      image: body.image,
      creator: apiKey || 'anonymous',
      creator_name: apiKey ? undefined : 'Anonymous',
    });
    
    const response: CreateTokenResponse = {
      success: true,
      token,
      mint: token.mint,
      signature: `mock_sig_${Date.now()}`,
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create token' },
      { status: 500 }
    );
  }
}
