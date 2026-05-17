import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const { data } = await supabase
    .from("titles")
    .select("id, title, poster_path, release_year, critic_score, media_type")
    .ilike("title", `%${q}%`)
    .order("critic_score", { ascending: false })
    .limit(8);

  return NextResponse.json({ results: data ?? [] });
}
