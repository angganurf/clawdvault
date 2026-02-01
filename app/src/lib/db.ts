import { supabaseAdmin, DbToken, DbTrade, TokenWithStats } from './supabase';
import { Token, Trade, INITIAL_VIRTUAL_SOL, INITIAL_VIRTUAL_TOKENS, calculatePrice, calculateMarketCap } from './types';

// Helper to get the admin client
const db = () => supabaseAdmin.get();

// Helper to generate random mint (for testing without real Solana)
function generateMint(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert DB token to API token
function dbToToken(row: DbToken | TokenWithStats): Token {
  const price = 'price_sol' in row && row.price_sol 
    ? Number(row.price_sol)
    : calculatePrice(Number(row.virtual_sol_reserves), Number(row.virtual_token_reserves));
  
  const marketCap = 'market_cap_sol' in row && row.market_cap_sol
    ? Number(row.market_cap_sol)
    : calculateMarketCap(Number(row.virtual_sol_reserves), Number(row.virtual_token_reserves), INITIAL_VIRTUAL_TOKENS);

  return {
    id: row.id,
    mint: row.mint,
    name: row.name,
    symbol: row.symbol,
    description: row.description || undefined,
    image: row.image || undefined,
    creator: row.creator,
    creator_name: row.creator_name || undefined,
    created_at: row.created_at,
    virtual_sol_reserves: Number(row.virtual_sol_reserves),
    virtual_token_reserves: Number(row.virtual_token_reserves),
    real_sol_reserves: Number(row.real_sol_reserves),
    real_token_reserves: Number(row.real_token_reserves),
    price_sol: price,
    market_cap_sol: marketCap,
    graduated: row.graduated,
    raydium_pool: row.raydium_pool || undefined,
    volume_24h: 'volume_24h' in row ? Number(row.volume_24h) : 0,
    trades_24h: 'trades_24h' in row ? Number(row.trades_24h) : 0,
    holders: 'holders' in row ? Number(row.holders) : 1,
  };
}

// Get all tokens
export async function getAllTokens(options?: {
  sort?: string;
  graduated?: boolean;
  page?: number;
  perPage?: number;
}): Promise<{ tokens: Token[]; total: number }> {
  const { sort = 'created_at', graduated, page = 1, perPage = 20 } = options || {};
  
  let query = db().from('token_stats').select('*', { count: 'exact' });
  
  // Filter by graduation
  if (graduated !== undefined) {
    query = query.eq('graduated', graduated);
  }
  
  // Sort
  switch (sort) {
    case 'market_cap':
      query = query.order('market_cap_sol', { ascending: false });
      break;
    case 'volume':
      query = query.order('volume_24h', { ascending: false });
      break;
    case 'price':
      query = query.order('price_sol', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }
  
  // Paginate
  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching tokens:', error);
    return { tokens: [], total: 0 };
  }
  
  return {
    tokens: (data || []).map(dbToToken),
    total: count || 0,
  };
}

// Get single token
export async function getToken(mint: string): Promise<Token | null> {
  const { data, error } = await db()
    .from('token_stats')
    .select('*')
    .eq('mint', mint)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return dbToToken(data);
}

// Get token trades
export async function getTokenTrades(mint: string, limit = 50): Promise<Trade[]> {
  const { data, error } = await db()
    .from('trades')
    .select('*')
    .eq('token_mint', mint)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) {
    return [];
  }
  
  return data.map((t: DbTrade) => ({
    id: t.id,
    token_mint: t.token_mint,
    trader: t.trader,
    type: t.trade_type,
    sol_amount: Number(t.sol_amount),
    token_amount: Number(t.token_amount),
    price_sol: Number(t.price_sol),
    signature: t.signature || '',
    created_at: t.created_at,
  }));
}

// Create token
export async function createToken(data: {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creator: string;
  creator_name?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}): Promise<Token | null> {
  const mint = generateMint();
  
  const { data: token, error } = await db()
    .from('tokens')
    .insert({
      mint,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      description: data.description,
      image: data.image,
      creator: data.creator,
      creator_name: data.creator_name,
      twitter: data.twitter,
      telegram: data.telegram,
      website: data.website,
      virtual_sol_reserves: INITIAL_VIRTUAL_SOL,
      virtual_token_reserves: INITIAL_VIRTUAL_TOKENS,
      real_sol_reserves: 0,
      real_token_reserves: INITIAL_VIRTUAL_TOKENS,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating token:', error);
    return null;
  }
  
  return dbToToken(token);
}

// Execute trade
export async function executeTrade(
  mint: string,
  type: 'buy' | 'sell',
  amount: number,
  trader: string
): Promise<{ token: Token; trade: Trade } | null> {
  // Get current token state
  const { data: token, error: fetchError } = await db()
    .from('tokens')
    .select('*')
    .eq('mint', mint)
    .single();
  
  if (fetchError || !token) {
    console.error('Token not found:', mint);
    return null;
  }
  
  let solAmount: number;
  let tokenAmount: number;
  let newVirtualSol: number;
  let newVirtualTokens: number;
  let newRealSol: number;
  let newRealTokens: number;
  
  const virtualSol = Number(token.virtual_sol_reserves);
  const virtualTokens = Number(token.virtual_token_reserves);
  const realSol = Number(token.real_sol_reserves);
  const realTokens = Number(token.real_token_reserves);
  
  if (type === 'buy') {
    solAmount = amount;
    newVirtualSol = virtualSol + solAmount;
    const invariant = virtualSol * virtualTokens;
    newVirtualTokens = invariant / newVirtualSol;
    tokenAmount = virtualTokens - newVirtualTokens;
    
    // Apply 1% fee
    const fee = solAmount * 0.01;
    const solAfterFee = solAmount - fee;
    
    newRealSol = realSol + solAfterFee;
    newRealTokens = realTokens - tokenAmount;
  } else {
    tokenAmount = amount;
    newVirtualTokens = virtualTokens + tokenAmount;
    const invariant = virtualSol * virtualTokens;
    newVirtualSol = invariant / newVirtualTokens;
    solAmount = virtualSol - newVirtualSol;
    
    // Apply 1% fee
    const fee = solAmount * 0.01;
    solAmount -= fee;
    
    newRealSol = realSol - solAmount;
    newRealTokens = realTokens + tokenAmount;
  }
  
  const newPrice = newVirtualSol / newVirtualTokens;
  const graduated = newRealSol >= 85; // ~$69K threshold
  
  // Update token
  const { error: updateError } = await db()
    .from('tokens')
    .update({
      virtual_sol_reserves: newVirtualSol,
      virtual_token_reserves: newVirtualTokens,
      real_sol_reserves: newRealSol,
      real_token_reserves: newRealTokens,
      graduated,
    })
    .eq('mint', mint);
  
  if (updateError) {
    console.error('Error updating token:', updateError);
    return null;
  }
  
  // Insert trade
  const { data: trade, error: tradeError } = await db()
    .from('trades')
    .insert({
      token_id: token.id,
      token_mint: mint,
      trader,
      trade_type: type,
      sol_amount: solAmount,
      token_amount: tokenAmount,
      price_sol: newPrice,
      signature: `mock_${Date.now()}`,
    })
    .select()
    .single();
  
  if (tradeError) {
    console.error('Error inserting trade:', tradeError);
    return null;
  }
  
  // Fetch updated token
  const updatedToken = await getToken(mint);
  if (!updatedToken) return null;
  
  return {
    token: updatedToken,
    trade: {
      id: trade.id,
      token_mint: trade.token_mint,
      trader: trade.trader,
      type: trade.trade_type,
      sol_amount: Number(trade.sol_amount),
      token_amount: Number(trade.token_amount),
      price_sol: Number(trade.price_sol),
      signature: trade.signature || '',
      created_at: trade.created_at,
    },
  };
}

// Validate API key
export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (apiKey === 'test_key') return true; // Allow test key
  
  const { data, error } = await db()
    .from('agents')
    .select('id')
    .eq('api_key', apiKey)
    .single();
  
  return !error && !!data;
}
