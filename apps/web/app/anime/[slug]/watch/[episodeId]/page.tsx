import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodePlayer } from "../../../../../components/episode-player";
import { getFallbackAnimeBySlug } from "../../../../../lib/catalog-fallback";

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
  releaseYear: number;
  rating: number;
  coverImage: string;
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

export default async function WatchEpisodePage({
  params
}: {
  params: { slug: string; episodeId: string };
}) {
  const anime = await getAnime(params.slug);

  if (!anime) {
    notFound();
  }

  const allEpisodes = anime.seasons.flatMap((season) =>
    season.episodes.map((episode) => ({ ...episode, seasonNumber: season.seasonNumber }))
  );
  const currentEpisode = allEpisodes.find((episode) => episode.id === params.episodeId);

  if (!currentEpisode) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05101d] via-[#0a1f35] to-[#071325] text-brand-cream">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:px-12">
        <header className="space-y-2">
          <Link className="text-sm text-brand-sky hover:underline" href={`/anime/${anime.slug}`}>
            ← Volver al detalle
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl">{anime.title}</h1>
          <p className="text-sm text-brand-cream/85">
            T{currentEpisode.seasonNumber} · Episodio {currentEpisode.episodeNumber}: {currentEpisode.title}
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-black/30 p-2 sm:p-3">
            <div className="aspect-video">
              <EpisodePlayer
                episodeId={currentEpisode.id}
                poster={currentEpisode.thumbnailImage}
                src={currentEpisode.videoUrl}
              />
            </div>
            <div className="px-1 pb-2 pt-3 sm:px-2">
              <p className="font-medium">{currentEpisode.title}</p>
              <p className="mt-1 text-sm text-brand-cream/80">
                {currentEpisode.synopsis ?? "Sinopsis no disponible."}
              </p>
            </div>
          </article>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <p className="mb-3 text-sm uppercase tracking-[0.15em] text-brand-sky">Lista de episodios</p>
            <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
              {allEpisodes.map((episode) => {
                const isCurrent = episode.id === currentEpisode.id;

                return (
                  <Link
                    key={episode.id}
                    className={`block rounded-xl border px-3 py-2 text-sm transition ${
                      isCurrent
                        ? "border-brand-amber/80 bg-brand-amber/10"
                        : "border-white/10 bg-black/20 hover:bg-black/30"
                    }`}
                    href={`/anime/${anime.slug}/watch/${episode.id}`}
                  >
                    <p className="text-xs text-brand-sky">
                      T{episode.seasonNumber} · E{episode.episodeNumber}
                    </p>
                    <p className="font-medium">{episode.title}</p>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
