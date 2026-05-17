import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl text-green-spooky drop-shadow-[0_0_20px_rgba(0,230,118,0.5)]">
        404
      </p>
      <h1 className="font-display text-3xl text-ghost mt-4">
        This page haunts us no more
      </h1>
      <p className="text-muted mt-2 max-w-sm">
        Whatever you were looking for has vanished into the darkness.
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 bg-purple-mid hover:bg-purple-light text-ghost font-medium rounded-xl transition-colors"
      >
        Back to safety
      </Link>
    </div>
  );
}
