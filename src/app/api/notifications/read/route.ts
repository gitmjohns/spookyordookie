import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { id } = body as { id?: string };

  if (id) {
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
  } else {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    revalidatePath("/notifications");
  }

  return NextResponse.json({ success: true });
}
