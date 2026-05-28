import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ratingLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { titleId, score } = body as { titleId: string; score: number };
  if (!titleId || typeof score !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try { await ratingLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Slow down — you're rating too fast" }, { status: 429 }); }

  const { error } = await supabase.from("ratings").upsert(
    { user_id: user.id, title_id: titleId, score },
    { onConflict: "user_id,title_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/movies/${titleId}`);
  revalidatePath(`/tv/${titleId}`);
  return NextResponse.json({ success: true });
}
