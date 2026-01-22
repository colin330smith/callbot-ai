/**
 * Supabase Client Configuration
 *
 * Server-side client for database operations.
 * Uses service role key for server-side operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Lazy-initialized Supabase client to handle missing env vars during build
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
}

// For backwards compatibility
export const supabase = {
  from: (table: string) => getSupabase().from(table),
};

// Database types
export interface Lead {
  id: string;
  email: string;
  risk_score: number | null;
  source: string;
  ip_hash: string | null;
  captured_at: string;
  emails_sent: number[];
  converted: boolean;
  created_at: string;
  updated_at: string;
}

export interface RateLimitRecord {
  id: string;
  ip_hash: string;
  count: number;
  reset_at: string;
  created_at: string;
}
