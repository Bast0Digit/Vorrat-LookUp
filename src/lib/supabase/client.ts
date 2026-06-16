import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Browser-side Supabase client, scoped to the `vorrat` schema.
// Use in Client Components only.
export function createClient() {
  return createBrowserClient<Database, "vorrat">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "vorrat" } },
  );
}
