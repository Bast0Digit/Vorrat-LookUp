// Generated Supabase types for the `vorrat` schema.
// Regenerate with the Supabase CLI:
//   supabase gen types typescript --project-id ggaiorygjkjhbfkvrfmb --schema vorrat > src/lib/supabase/types.ts
//
// This is a minimal placeholder so the client helpers type-check before the first
// generation. It will be replaced by the full generated file.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  vorrat: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
