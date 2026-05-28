import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyWordFilter } from "@/lib/wordFilter";
import { sanitizeText } from "@/lib/sanitize";
import { postLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { titleId, content, parentId } = body as { titleId: string; content: string; parentId: string | null };
  if (!titleId || !content) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("banned").eq("id", user.id).single();
  if (profile?.banned) return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });

  try { await postLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Slow down — you're posting too fast" }, { status: 429 }); }

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    title_id: titleId,
    content: applyWordFilter(sanitizeText(content)),
    parent_id: parentId ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/movies/${titleId}`);
  revalidatePath(`/tv/${titleId}`);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { commentId } = body as { commentId: string };
  if (!commentId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await supabase.from("comments").delete().eq("parent_id", commentId);
  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { commentId, content } = body as { commentId: string; content: string };
  if (!commentId || !content) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try { await postLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Slow down — you're posting too fast" }, { status: 429 }); }

  const trimmed = applyWordFilter(sanitizeText(content.trim()));
  if (!trimmed) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const { error } = await supabase.from("comments")
    .update({ content: trimmed })
    .eq("id", commentId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
