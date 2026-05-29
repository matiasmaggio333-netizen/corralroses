import { createClient } from "@supabase/supabase-js"

export const config = { runtime: "edge" }

export default async function handler() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )
  await supabase.from("categories").select("id").limit(1)
  return new Response("ok", { status: 200 })
}