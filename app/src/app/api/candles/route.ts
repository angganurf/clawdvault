import { NextRequest, NextResponse } from 'next/server';
import { getCandles } from '@/lib/candles';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get('mint');
    const interval = searchParams.get('interval') || '5m';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    if (!mint) {
      return NextResponse.json({ error: 'mint parameter required' }, { status: 400 });
    }
    
    // Validate interval
    const validIntervals = ['1m', '5m', '15m', '1h', '1d'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json({ 
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` 
      }, { status: 400 });
    }
    
    const candles = await getCandles(
      mint, 
      interval as '1m' | '5m' | '15m' | '1h' | '1d',
      Math.min(limit, 1000) // Cap at 1000
    );
    
    return NextResponse.json({
      mint,
      interval,
      candles,
    });
  } catch (error) {
    console.error('Failed to fetch candles:', error);
    return NextResponse.json({ error: 'Failed to fetch candles' }, { status: 500 });
  }
}
