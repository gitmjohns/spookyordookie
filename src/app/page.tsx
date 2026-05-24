export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { TitleCard } from "@/components/TitleCard";
import type { Title } from "@/lib/types";
import {
  getGoats, getCultClassics, getLatestSpooks,
  getSpookyComedies, getTopTV,
  getSubgenreSpotlightTitles, getFeaturedSubgenre,
  getWatchlistIds, getCurrentUser,
} from "@/lib/data";

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, href }: { title: string; sub: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-3xl text-ghost">{title}</h2>
        <p className="text-muted text-sm mt-0.5">{sub}</p>
      </div>
      {href && (
        <Link href={href} className="text-sm font-bold text-green-spooky hover:underline shrink-0">
          View All →
        </Link>
      )}
    </div>
  );
}

interface RowProps { isLoggedIn: boolean; watchlistIds: Set<string> }

function TitleGrid({ titles, isLoggedIn, watchlistIds }: { titles: Title[] } & RowProps) {
  if (!titles.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {titles.map((t) => (
        <TitleCard key={t.id} title={t} inWatchlist={watchlistIds.has(t.id)} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-tomb border border-shadow animate-pulse">
          <div className="aspect-[2/3] bg-shadow rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-shadow rounded w-4/5" />
            <div className="h-3 bg-shadow rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section className="py-10 border-t border-shadow">
      <div className="mb-5">
        <div className="h-8 w-56 bg-tomb rounded animate-pulse" />
        <div className="h-4 w-72 bg-tomb rounded animate-pulse mt-1" />
      </div>
      <GridSkeleton />
    </section>
  );
}

// ─── Row 1: Spooky G.O.A.T. ──────────────────────────────────────────────────

async function SpookyGoat({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getGoats(12);
  if (!titles.length) return null;
  return (
    <section className="pt-6 pb-10">
      <SectionHeader
        title="Spooky G.O.A.T."
        sub="The greatest horror films ever made — Critic Score 85+"
        href="/movies?sort=top-rated"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 2: Buried Treasures ─────────────────────────────────────────────────

async function CultClassics({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getCultClassics(6);
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Buried Treasures"
        sub="Overlooked, underseen, and worth every scream"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 3: Latest Spooks ─────────────────────────────────────────────────────

async function LatestSpooks({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getLatestSpooks(12); // 2 rows
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Latest Spooks"
        sub="New and recent horror releases"
        href="/movies?sort=newest"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 4: Spooky Comedies ───────────────────────────────────────────────────

async function SpookyComedies({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getSpookyComedies(6);
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Spooky Comedies"
        sub="Horror that makes you laugh before it makes you scream"
        href="/movies?genre=Comedy+Horror"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 5: Subgenre Spotlight ────────────────────────────────────────────────

async function SubgenreSpotlight({ isLoggedIn, watchlistIds }: RowProps) {
  const spotlight = await getFeaturedSubgenre();
  const titles = await getSubgenreSpotlightTitles(spotlight.db, 6);
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title={`Weekly Possession: ${spotlight.display}`}
        sub="Weekly rotating subgenre spotlight"
        href={`/movies?genre=${encodeURIComponent(spotlight.db)}`}
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 6: TV Serial Spooks ──────────────────────────────────────────────

async function TopHorrorTV({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getTopTV(12); // 2 rows
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Serial Spooks: TV"
        sub="Highest rated horror series, anthologies, and limited runs"
        href="/tv"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [user, watchlistIds] = await Promise.all([getCurrentUser(), getWatchlistIds()]);
  const isLoggedIn = !!user;

  return (
    <div>
      {/* Hero */}
      <div className="relative w-full h-[22vw] min-h-[140px] max-h-[360px] overflow-hidden">
        <Image
          src="/newbannerimageskeleton.PNG"
          alt="Spooky or Dookie"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: "center 65%" }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-48 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 100%, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 35%, rgba(10,10,10,0.3) 60%, transparent 80%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/30 flex flex-col items-center justify-center px-4">
          <h1
            className="font-display text-center whitespace-nowrap select-none text-[2.4rem] sm:text-[3.1rem] md:text-[3.7rem] lg:text-[4.9rem] xl:text-[6.5rem]"
            style={{ color: "#7dff6b", WebkitTextStroke: "2.5px #0f8000", textShadow: "0 2px 20px rgba(0,0,0,1), 0 1px 6px rgba(0,0,0,1)", letterSpacing: "0.03em" }}
          >
            Spoo<span style={{ letterSpacing: "0.1em" }}>k</span>y or Doo<span style={{ letterSpacing: "0.1em" }}>k</span>ie
          </h1>
          <p
            className="mt-2 sm:mt-3 text-base sm:text-lg md:text-xl font-semibold tracking-wide text-center select-none"
            style={{ color: "#c8b8d8", textShadow: "0 0 12px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,1), 0 1px 2px rgba(0,0,0,1)" }}
          >
            Rate every horror title from Spooky to Dookie
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionSkeleton />}><SpookyGoat isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><CultClassics isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><LatestSpooks isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><SpookyComedies isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><SubgenreSpotlight isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><TopHorrorTV isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
      </div>
    </div>
  );
}
