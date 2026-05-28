import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { titleId, currentlyInList } = body as { titleId: string; currentlyInList: boolean };
  if (!titleId || typeof currentlyInList !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (currentlyInList) {
    await supabase.from("watchlist").delete().eq("user_id", user.id).eq("title_id", titleId);
  } else {
    await supabase.from("watchlist").insert({ user_id: user.id, title_id: titleId });
  }

  revalidatePath("/watchlist");
  return NextResponse.json({ success: true });
}
