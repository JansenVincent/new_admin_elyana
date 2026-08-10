import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_TIMEOUT_MS } from "@/shared/constants/auth";

/**
 * Membuat fetch wrapper dengan timeout 60 detik untuk request Supabase server.
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

let supabaseServerInstance: SupabaseClient | null = null;

/**
 * Mengembalikan singleton Supabase client dengan service role key (hanya server-side).
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServerInstance) {
    return supabaseServerInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di .env"
    );
  }

  supabaseServerInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: createFetchWithTimeout(SUPABASE_TIMEOUT_MS),
    },
  });

  return supabaseServerInstance;
}
