import { createClient } from "@supabase/supabase-js";

const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();

export const supabase = createClient(
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
);