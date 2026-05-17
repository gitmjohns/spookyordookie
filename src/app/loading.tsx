export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-deep border-t-green-spooky rounded-full animate-spin" />
        <p className="text-muted font-display text-xl">Summoning horrors…</p>
      </div>
    </div>
  );
}
