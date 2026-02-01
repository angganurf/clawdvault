import { NextResponse } from 'next/server';
import { getAllTokens } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const sort = searchParams.get('sort') || 'created_at';
    const graduated = searchParams.get('graduated');
    
    let tokens = getAllTokens();
    
    // Filter by graduation status
    if (graduated !== null) {
      const isGraduated = graduated === 'true';
      tokens = tokens.filter(t => t.graduated === isGraduated);
    }
    
    // Sort
    if (sort === 'market_cap') {
      tokens.sort((a, b) => b.market_cap_sol - a.market_cap_sol);
    } else if (sort === 'volume') {
      tokens.sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));
    } else if (sort === 'price') {
      tokens.sort((a, b) => b.price_sol - a.price_sol);
    }
    // Default: created_at (already sorted)
    
    // Paginate
    const start = (page - 1) * perPage;
    const paginatedTokens = tokens.slice(start, start + perPage);
    
    return NextResponse.json({
      tokens: paginatedTokens,
      total: tokens.length,
      page,
      per_page: perPage,
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
