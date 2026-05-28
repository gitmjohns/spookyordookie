import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — TerrorMeter" };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-5xl text-ghost mb-6">About</h1>

      <div className="space-y-6 text-specter leading-relaxed">
        <p>
          TerrorMeter is a horror film and TV rating site built for people who take their scares seriously.
          Rate everything from certified classics to straight-to-VOD nonsense, and find out what the community thinks is Terrifying — and what&apos;s just Terrible.
        </p>
        <p>
          Browse over a thousand horror titles spanning the 1970s to the present, filter by subgenre, decade, and critic score, and keep a watchlist of everything you want to see next.
        </p>
      </div>

      <hr className="border-shadow my-10" />

      <section>
        <h2 className="font-display text-2xl text-ghost mb-4">Data Attribution</h2>
        <div className="flex flex-col gap-4">
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block opacity-80 hover:opacity-100 transition-opacity"
            title="The Movie Database"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tmdb-logo.svg" alt="TMDB" width={100} height={14} />
          </a>
          <p className="text-sm text-muted">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <p className="text-sm text-muted">
            Movie and TV show data — including titles, descriptions, poster images, and release information — is provided by{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-spooky hover:underline"
            >
              The Movie Database (TMDB)
            </a>
            , a community-built movie and TV database.
          </p>
        </div>
      </section>
    </div>
  );
}
