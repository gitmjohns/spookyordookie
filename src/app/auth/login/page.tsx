import { cookies } from "next/headers";
import { LoginForm } from "./LoginForm";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

function sanitizeNext(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/";
  return raw;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);

  // Set the redirect cookie server-side so it is guaranteed to exist before
  // the user clicks a provider button and the OAuth redirect starts.
  // Using cookies() here makes this page dynamically rendered, ensuring
  // searchParams always reflect the actual request URL.
  const cookieStore = await cookies();
  if (next !== "/") {
    cookieStore.set("auth_next", next, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });
  } else {
    cookieStore.delete("auth_next");
  }

  return <LoginForm />;
}
