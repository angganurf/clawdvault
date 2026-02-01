import { NextResponse } from 'next/server';
import { getAllTokens } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const sort = searchParams.get('sort') || 'created_at';
    const graduatedParam = searchParams.get('graduated');
    
    const graduated = graduatedParam !== null 
      ? graduatedParam === 'true'
      : undefined;
    
    const { tokens, total } = await getAllTokens({
      sort,
      graduated,
      page,
      perPage,
    });
    
    return NextResponse.json({
      tokens,
      total,
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
