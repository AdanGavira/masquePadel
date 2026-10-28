import "server-only";
import { demoBackend } from "./demo-backend";
import { supabaseBackend } from "./supabase-backend";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const backend = isSupabaseConfigured ? supabaseBackend : demoBackend;

export type * from "./types";
