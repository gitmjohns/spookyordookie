"use client";

import { useState, useTransition } from "react";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) ?? "";
    const email = (formData.get("email") as string) ?? "";
    const message = (formData.get("message") as string) ?? "";
    startTransition(async () => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      setResult(data);
    });
  }

  if (result?.success) {
    return (
      <div className="bg-tomb border border-shadow rounded-2xl p-8 text-center space-y-3">
        <div className="text-4xl">👻</div>
        <p className="text-ghost font-medium">Your message has been sent.</p>
        <p className="text-muted text-sm">We will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-tomb border border-shadow rounded-2xl p-6 sm:p-8 space-y-5">
      {result?.error && (
        <div className="bg-red-950/40 border border-red-800/50 text-ghost text-sm rounded-lg px-4 py-3">
          {result.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-specter">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          maxLength={100}
          className="w-full bg-shadow border border-shadow rounded-lg px-4 py-2.5 text-ghost text-sm placeholder:text-muted/50 focus:outline-none focus:border-purple-mid transition-colors"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-specter">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          className="w-full bg-shadow border border-shadow rounded-lg px-4 py-2.5 text-ghost text-sm placeholder:text-muted/50 focus:outline-none focus:border-purple-mid transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium text-specter">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          className="w-full bg-shadow border border-shadow rounded-lg px-4 py-2.5 text-ghost text-sm placeholder:text-muted/50 focus:outline-none focus:border-purple-mid transition-colors resize-y"
          placeholder="What's on your mind?"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-green-spooky text-void font-bold text-sm hover:bg-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
