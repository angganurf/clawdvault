import { NextResponse } from 'next/server';
import { createToken } from '@/lib/db';
import { CreateTokenRequest, CreateTokenResponse } from '@/lib/types';

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
