import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (set in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseUrl) {
      throw new Error('Supabase URL is required');
    }
    const key = supabaseServiceKey || supabaseAnonKey;
    if (!key) {
      throw new Error('Supabase key is required');
    }
    _supabaseAdmin = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// Export getters instead of direct clients
export const supabase = { get: getSupabase };
export const supabaseAdmin = { get: getSupabaseAdmin };

// Database types
export interface DbToken {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  description: string | null;
  image: string | null;
  creator: string;
  creator_name: string | null;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  real_sol_reserves: number;
  real_token_reserves: number;
  graduated: boolean;
  raydium_pool: string | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTrade {
  id: string;
  token_id: string;
  token_mint: string;
  trader: string;
  trade_type: 'buy' | 'sell';
  sol_amount: number;
  token_amount: number;
  price_sol: number;
  signature: string | null;
  created_at: string;
}

export interface DbAgent {
  id: string;
  wallet: string;
  name: string | null;
  api_key: string;
  moltbook_verified: boolean;
  moltx_verified: boolean;
  twitter_handle: string | null;
  tokens_created: number;
  total_volume: number;
  created_at: string;
  updated_at: string;
}

export interface TokenWithStats extends DbToken {
  price_sol: number;
  market_cap_sol: number;
  volume_24h: number;
  trades_24h: number;
  holders: number;
}
