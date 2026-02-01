import { createClient } from '@supabase/supabase-js';

// Environment variables (set in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for public access (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (API routes)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

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
