import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { applyWordFilter } from "@/lib/wordFilter";
import { sanitizeText } from "@/lib/sanitize";
import { postLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { threadId, content } = body as { threadId: string; content: string };
  if (!threadId || !content) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("banned").eq("id", user.id).single();
  if (profile?.banned) return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });

  try { await postLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Slow down — you're posting too fast" }, { status: 429 }); }

  const { error } = await supabase.from("debate_replies")
    .insert({ thread_id: threadId, user_id: user.id, content: applyWordFilter(sanitizeText(content.trim())) });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("debate_follows")
    .upsert({ user_id: user.id, thread_id: threadId }, { onConflict: "user_id,thread_id" });

  const svc = serviceClient();
  const [{ data: thread }, { data: followers }] = await Promise.all([
    svc.from("debate_threads").select("title_id").eq("id", threadId).single(),
    svc.from("debate_follows").select("user_id").eq("thread_id", threadId).neq("user_id", user.id),
  ]);

  if (thread?.title_id && followers && followers.length > 0) {
    await svc.from("notifications").insert(
      followers.map((f: { user_id: string }) => ({
        user_id: f.user_id,
        actor_id: user.id,
        title_id: thread.title_id,
        type: "debate_follow_reply",
        read: false,
      }))
    );
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { replyId, content } = body as { replyId: string; content: string };
  if (!replyId || !content) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try { await postLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Slow down — you're posting too fast" }, { status: 429 }); }

  const trimmed = applyWordFilter(sanitizeText(content.trim()));
  if (!trimmed) return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });

  const { error } = await supabase.from("debate_replies")
    .update({ content: trimmed })
    .eq("id", replyId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
