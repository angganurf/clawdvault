/**
 * Cron: Sync on-chain trades
 * Runs every minute to catch any missed trades
 * 
 * Vercel Cron calls this with CRON_SECRET header
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for sync

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('⚠️ Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔄 [CRON] Starting trade sync...');
  
  try {
    // Call the sync endpoint internally
    // Use canonical URL in prod, fallback to VERCEL_URL, then localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/sync/trades?limit=200`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check for non-JSON response (error pages, etc.)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ [CRON] Non-JSON response (${response.status}):`, text.slice(0, 500));
      return NextResponse.json({
        success: false,
        error: `Sync endpoint returned ${response.status}: ${text.slice(0, 100)}`,
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    console.log(`🔄 [CRON] Sync complete: ${data.synced || 0} new trades`);
    
    return NextResponse.json({
      success: true,
      cron: 'sync-trades',
      ...data,
    });
    
  } catch (error) {
    console.error('❌ [CRON] Sync failed:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
