import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { commentId } = body as { commentId: string };
  if (!commentId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: existing } = await supabase
    .from("comment_downvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single();

  if (existing) {
    await supabase.from("comment_downvotes").delete().eq("user_id", user.id).eq("comment_id", commentId);
    await supabase.rpc("decrement_downvote", { comment_id: commentId });
  } else {
    await supabase.from("comment_downvotes").insert({ user_id: user.id, comment_id: commentId });
    await supabase.rpc("increment_downvote", { comment_id: commentId });
  }

  return NextResponse.json({ success: true });
}
