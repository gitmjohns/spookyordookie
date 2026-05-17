import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string>;
}

function buildWindow(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  let start = current - 2;
  let end = current + 2;
  if (start < 1) { start = 1; end = 5; }
  if (end > total) { end = total; start = total - 4; }
  return Array.from({ length: 5 }, (_, i) => start + i);
}

function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const win = buildWindow(current, total);
  const result: (number | "...")[] = [...win];
  const last = win[win.length - 1];

  if (last < total) {
    const gap = total - last;
    if (gap <= 2) {
      for (let p = last + 1; p <= total; p++) result.push(p);
    } else {
      result.push("...");
      result.push(total);
    }
  }

  return result;
}

export function Pagination({ page, totalPages, basePath, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    return `${basePath}?${new URLSearchParams({ ...params, page: String(p) })}`;
  }

  const pages = buildPages(page, totalPages);

  const navBtn =
    "flex items-center justify-center w-9 h-9 rounded text-sm font-medium transition-colors bg-tomb border border-shadow text-specter hover:text-ghost hover:border-purple-mid";
  const disabledBtn =
    "flex items-center justify-center w-9 h-9 rounded text-sm bg-tomb/40 border border-shadow/40 text-muted/50 cursor-not-allowed select-none";
  const pageBtn =
    "flex items-center justify-center w-9 h-9 rounded text-sm font-medium transition-colors bg-tomb border border-shadow text-specter hover:text-ghost hover:border-green-spooky/60";
  const activeBtn =
    "flex items-center justify-center w-9 h-9 rounded text-sm font-bold bg-green-spooky text-void border border-green-spooky select-none";
  const ellipsis =
    "flex items-center justify-center w-9 h-9 text-muted text-sm select-none";

  return (
    <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">
      {page > 1 ? (
        <Link href={href(1)} className={navBtn} title="First page">«</Link>
      ) : (
        <span className={disabledBtn}>«</span>
      )}
      {page > 1 ? (
        <Link href={href(page - 1)} className={navBtn} title="Previous page">‹</Link>
      ) : (
        <span className={disabledBtn}>‹</span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className={ellipsis}>…</span>
        ) : p === page ? (
          <span key={p} className={activeBtn}>{p}</span>
        ) : (
          <Link key={p} href={href(p)} className={pageBtn}>{p}</Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={navBtn} title="Next page">›</Link>
      ) : (
        <span className={disabledBtn}>›</span>
      )}
      {page < totalPages ? (
        <Link href={href(totalPages)} className={navBtn} title="Last page">»</Link>
      ) : (
        <span className={disabledBtn}>»</span>
      )}
    </div>
  );
}
