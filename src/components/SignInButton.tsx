"use client";

interface Props {
  className?: string;
}

export function SignInButton({ className }: Props) {
  function handleClick() {
    localStorage.setItem("returnTo", window.location.pathname);
  }

  return (
    <a href="/auth/login" className={className} onClick={handleClick}>
      Sign In
    </a>
  );
}
