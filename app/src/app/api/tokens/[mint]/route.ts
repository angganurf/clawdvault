import { NextResponse } from 'next/server';
import { getToken, getTokenTrades } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await params;
    const token = getToken(mint);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }
    
    const trades = getTokenTrades(mint).slice(0, 50);
    
    return NextResponse.json({
      token,
      trades,
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
