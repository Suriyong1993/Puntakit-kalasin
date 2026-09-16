import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "ยังไม่ได้ตั้งค่าฐานข้อมูล Puntakit กรุณาตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ก่อนใช้งาน"
    );
    this.name = "SupabaseConfigurationError";
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new SupabaseConfigurationError();
  }

  client ??= createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
