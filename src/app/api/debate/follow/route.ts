import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { threadId } = body as { threadId: string };
  if (!threadId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: existing } = await supabase
    .from("debate_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("thread_id", threadId)
    .maybeSingle();

  if (existing) {
    await supabase.from("debate_follows").delete().eq("user_id", user.id).eq("thread_id", threadId);
    return NextResponse.json({ success: true, following: false });
  } else {
    await supabase.from("debate_follows").insert({ user_id: user.id, thread_id: threadId });
    return NextResponse.json({ success: true, following: true });
  }
}
