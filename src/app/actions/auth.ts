"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { usernameHasBannedWord } from "@/lib/wordFilter";

export async function setAuthNextCookie(next: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) return;
  const cookieStore = await cookies();
  cookieStore.set("auth_next", next, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 300 });
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = (formData.get("username") as string)?.trim().toLowerCase();

  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { error: "Username must be 3-20 characters (letters, numbers, underscores)" };
  }
  if (usernameHasBannedWord(username)) {
    return { error: "That username is not allowed." };
  }

  const svc = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  const { data: existing } = await svc.from("profiles").select("id").eq("username", username).single();
  if (existing) return { error: "Username already taken" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (data.user) {
    await svc.from("profiles").insert({ id: data.user.id, username });
  }
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
