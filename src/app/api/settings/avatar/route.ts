import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_EMOJI = ['💀','👻','🧟','🕷','🎃','🧛','🔪','🪓','🩸','🦇','🐺','👁','🕸','⚰️','🪦','🧠','🐀','🌕'];
const VALID_BG    = ['#0a0a0f','#2d0a4a','#4a0a0a','#0a0a3a','#2a1500','#1a1a2a','#3a1500','#0a2a0a','#0a1a2a','#3a0015'];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { emoji, bg } = body as { emoji: string; bg: string };
  if (!VALID_EMOJI.includes(emoji)) return NextResponse.json({ error: "Invalid emoji selection" }, { status: 400 });
  if (!VALID_BG.includes(bg)) return NextResponse.json({ error: "Invalid color selection" }, { status: 400 });

  const { error } = await supabase.from("profiles").update({ avatar_emoji: emoji, avatar_bg: bg }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/settings");
  return NextResponse.json({ success: true });
}
