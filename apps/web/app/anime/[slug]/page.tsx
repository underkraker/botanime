import Link from "next/link";
import { notFound } from "next/navigation";
import { getFallbackAnimeBySlug } from "../../../lib/catalog-fallback";

type Episode = {
  id: string;
  episodeNumber: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number;
  thumbnailImage: string;
  videoUrl: string;
};

type Season = {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
};

type AnimeDetail = {
  slug: string;
  title: string;
  synopsis: string;
  genre: string;
  status: string;
  releaseYear: number;
  rating: number;
  coverImage: string;
  bannerImage: string;
  seasons: Season[];
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getAnime(slug: string): Promise<AnimeDetail | null> {
  try {
    const response = await fetch(`${apiBase}/catalog/animes/${slug}`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return getFallbackAnimeBySlug(slug);
    }

    return (await response.json()) as AnimeDetail;
  } catch {
    return getFallbackAnimeBySlug(slug);
  }
}

export default async function AnimeDetailPage({ params }: { params: { slug: string } }) {
  const anime = await getAnime(params.slug);

  if (!anime) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-navy via-[#0b2740] to-[#060d17] text-brand-cream">
      <section
        className="relative h-56 w-full bg-cover bg-center sm:h-72 lg:h-96"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(5,8,14,0.9)), url(${anime.bannerImage})` }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-end px-5 pb-6 sm:px-8 lg:px-12">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-sky">Detalle de anime</p>
            <h1 className="font-display text-3xl sm:text-5xl">{anime.title}</h1>
            <p className="text-sm text-brand-cream/85 sm:text-base">
              {anime.genre} · {anime.releaseYear} · ⭐ {anime.rating} · {anime.status}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <article
            className="h-72 rounded-2xl border border-white/10 bg-cover bg-center"
            style={{ backgroundImage: `url(${anime.coverImage})` }}
          />
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm leading-relaxed text-brand-cream/90">{anime.synopsis}</p>
            <Link
              className="mt-4 inline-flex rounded-full bg-brand-amber px-5 py-2 text-sm font-semibold text-[#1d1204] transition hover:brightness-110"
              href={
                anime.seasons[0]?.episodes[0]?.id
                  ? `/anime/${anime.slug}/watch/${anime.seasons[0].episodes[0].id}`
                  : "#"
              }
            >
              Reproducir episodio 1
            </Link>
          </article>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl">Temporadas y episodios</h2>
          <div className="space-y-5">
            {anime.seasons.map((season) => (
              <article key={season.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-display text-xl">
                  T{season.seasonNumber}: {season.title}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {season.episodes.map((episode) => (
                    <Link
                      key={episode.id}
                      className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                      href={`/anime/${anime.slug}/watch/${episode.id}`}
                    >
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${episode.thumbnailImage})` }}
                      />
                      <div className="space-y-1 p-3">
                        <p className="text-xs uppercase tracking-wide text-brand-sky">
                          Episodio {episode.episodeNumber}
                        </p>
                        <p className="font-medium">{episode.title}</p>
                        <p className="text-xs text-brand-cream/80">{episode.durationMinutes} min</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
