import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { titleId, watched } = body as { titleId: string; watched: boolean };
  if (!titleId || typeof watched !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await supabase.from("watchlist")
    .update({ watched, watched_at: watched ? new Date().toISOString() : null })
    .eq("user_id", user.id).eq("title_id", titleId);

  revalidatePath("/watchlist");
  return NextResponse.json({ success: true });
}
