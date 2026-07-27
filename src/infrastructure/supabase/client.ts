import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_TIMEOUT_MS } from "@/shared/constants/auth";

/**
 * Membuat fetch wrapper dengan timeout 60 detik untuk request Supabase.
 */
function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

let supabaseInstance: SupabaseClient | null = null;

/**
 * Mengembalikan singleton Supabase client dengan timeout 60 detik.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus diset di .env"
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createFetchWithTimeout(SUPABASE_TIMEOUT_MS),
    },
  });

  return supabaseInstance;
}
