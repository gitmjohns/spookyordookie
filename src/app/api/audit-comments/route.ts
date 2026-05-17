import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Find titles with fewer than 5 ratings
  const { data: lowRatingTitles } = await supabase
    .from("titles")
    .select("id, title, rating_count")
    .lt("rating_count", 5);

  if (!lowRatingTitles?.length) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  const lowIds = lowRatingTitles.map((t) => t.id);

  // Count before deletion
  const { count: beforeCount } = await supabase
    .from("comments")
    .select("id", { count: "exact" })
    .in("title_id", lowIds);

  // Delete comments for those titles in batches
  let deleted = 0;
  for (let i = 0; i < lowIds.length; i += 100) {
    const batch = lowIds.slice(i, i + 100);
    const { count } = await supabase
      .from("comments")
      .delete({ count: "exact" })
      .in("title_id", batch);
    deleted += count ?? 0;
  }

  return NextResponse.json({
    success: true,
    titlesUnder5Ratings: lowRatingTitles.length,
    deleted: deleted ?? beforeCount ?? 0,
  });
}
