export default function Loading() {
  return (
    <div>
      <div className="h-80 bg-tomb animate-pulse" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-52 h-72 bg-tomb rounded-xl animate-pulse -mt-24 shrink-0" />
          <div className="flex-1 space-y-4 mt-4">
            <div className="h-6 bg-tomb rounded w-1/4 animate-pulse" />
            <div className="h-12 bg-tomb rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-tomb rounded animate-pulse" />
            <div className="h-4 bg-tomb rounded w-5/6 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
