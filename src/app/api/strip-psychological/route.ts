import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Fetch all titles that still contain Psychological
  const affected: { id: string; subgenres: string[] }[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from("titles")
      .select("id, subgenres")
      .contains("subgenres", ["Psychological"])
      .range(from, from + 499);
    if (!data?.length) break;
    affected.push(...data);
    if (data.length < 500) break;
    from += 500;
  }

  if (affected.length === 0) {
    return NextResponse.json({ success: true, updated: 0, message: "Nothing to do" });
  }

  // Use individual update() calls in parallel batches of 50
  let updated = 0;
  const BATCH = 50;

  for (let i = 0; i < affected.length; i += BATCH) {
    const batch = affected.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(({ id, subgenres }) =>
        supabase
          .from("titles")
          .update({ subgenres: subgenres.filter((s) => s !== "Psychological") })
          .eq("id", id)
      )
    );
    updated += results.filter((r) => !r.error).length;
    if (i + BATCH < affected.length) await new Promise((r) => setTimeout(r, 80));
  }

  return NextResponse.json({ success: true, found: affected.length, updated });
}
