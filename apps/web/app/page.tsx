import Link from "next/link";
import { ContinueWatching } from "../components/continue-watching";

type AnimeCard = {
  slug: string;
  title: string;
  genre: string;
  episodeCount: number;
  coverImage: string;
  rating: number;
};

const fallbackAnimes: AnimeCard[] = [
  {
    slug: "blaze-of-orion",
    title: "Blaze of Orion",
    genre: "Accion",
    episodeCount: 24,
    rating: 4.8,
    coverImage:
      "https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "lunar-harbor",
    title: "Lunar Harbor",
    genre: "Romance",
    episodeCount: 12,
    rating: 4.6,
    coverImage:
      "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "neon-ronin",
    title: "Neon Ronin",
    genre: "Sci-Fi",
    episodeCount: 18,
    rating: 4.7,
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"
  }
];

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getFeaturedAnimes(): Promise<AnimeCard[]> {
  try {
    const response = await fetch(`${apiBase}/catalog/animes`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) {
      return fallbackAnimes;
    }

    const data = (await response.json()) as Array<{
      slug: string;
      title: string;
      genre: string;
      episodeCount: number;
      coverImage: string;
      rating: number;
    }>;

    if (!Array.isArray(data) || data.length === 0) {
      return fallbackAnimes;
    }

    return data;
  } catch {
    return fallbackAnimes;
  }
}

export default async function HomePage() {
  const animes = await getFeaturedAnimes();

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-navy via-brand-slate to-[#08111f] text-brand-cream">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-16 pt-8 sm:px-8 lg:px-12">
        <header className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-glow backdrop-blur-sm sm:p-8">
          <p className="mb-3 inline-flex rounded-full bg-brand-amber/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-amber">
            Streaming anime
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-5xl lg:text-6xl">
            Tu plataforma de anime pensada para cualquier pantalla
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-brand-cream/90 sm:text-base lg:text-lg">
            Empezamos el MVP con un catalogo rapido, detalle de series y base para
            reproductor HLS. Layout mobile-first y escalado fluido para telefono,
            tablet, laptop y TV.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-brand-amber px-5 py-2 text-sm font-semibold text-[#1d1204] transition hover:brightness-110"
              href="/auth"
            >
              Crear cuenta
            </Link>
            <Link
              className="rounded-full border border-brand-sky/60 px-5 py-2 text-sm font-semibold text-brand-sky transition hover:bg-brand-sky/10"
              href="/auth"
            >
              Iniciar sesion
            </Link>
            <Link
              className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-brand-cream transition hover:bg-white/10"
              href="/admin"
            >
              Panel admin
            </Link>
          </div>
        </header>

        <ContinueWatching />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl sm:text-3xl">Tendencias</h2>
            <a className="text-sm font-medium text-brand-sky hover:underline" href="#">
              Ver todo
            </a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {animes.map((anime) => (
              <article
                key={anime.title}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div
                  className="h-48 w-full bg-cover bg-center sm:h-56"
                  style={{ backgroundImage: `url(${anime.coverImage})` }}
                />
                <div className="space-y-2 p-4">
                  <h3 className="font-display text-xl">{anime.title}</h3>
                  <p className="text-sm text-brand-cream/80">
                    {anime.genre} · {anime.episodeCount} episodios · ⭐ {anime.rating}
                  </p>
                  <Link
                    className="mt-2 inline-flex rounded-full border border-brand-amber/70 px-4 py-2 text-sm font-semibold text-brand-amber transition hover:bg-brand-amber/10"
                    href={`/anime/${anime.slug}`}
                  >
                    Abrir detalle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
