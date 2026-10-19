import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 프로젝트 연결 정보
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://cxgvharfkzdqiiquroqz.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_N5Xy5DP47wg4vOuK9Vu1Yg_crTzHNpH';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim() === '') {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
}

export function isSupabaseEnabled(): boolean {
  return !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 10;
}
