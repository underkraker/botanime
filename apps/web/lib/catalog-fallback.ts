export type FallbackEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  synopsis: string;
  durationMinutes: number;
  thumbnailImage: string;
  videoUrl: string;
};

export type FallbackSeason = {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: FallbackEpisode[];
};

export type FallbackAnime = {
  slug: string;
  title: string;
  synopsis: string;
  genre: string;
  status: string;
  releaseYear: number;
  rating: number;
  coverImage: string;
  bannerImage: string;
  seasons: FallbackSeason[];
};

export const fallbackCatalog: FallbackAnime[] = [
  {
    slug: "blaze-of-orion",
    title: "Blaze of Orion",
    synopsis:
      "Un escuadron juvenil protege colonias orbitales mientras descubre una guerra olvidada.",
    genre: "Accion",
    status: "ongoing",
    releaseYear: 2025,
    rating: 4.8,
    coverImage:
      "https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=1200&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1600&q=80",
    seasons: [
      {
        id: "blaze-s1",
        seasonNumber: 1,
        title: "Temporada 1",
        episodes: [
          {
            id: "blaze-s1-e1",
            episodeNumber: 1,
            title: "Despertar orbital",
            durationMinutes: 24,
            synopsis: "Orion recibe su primera mision real fuera de la academia.",
            thumbnailImage:
              "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
            videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          },
          {
            id: "blaze-s1-e2",
            episodeNumber: 2,
            title: "Lluvia de meteoros",
            durationMinutes: 24,
            synopsis: "El equipo enfrenta una emboscada mientras escolta refugiados.",
            thumbnailImage:
              "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
            videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          }
        ]
      }
    ]
  },
  {
    slug: "lunar-harbor",
    title: "Lunar Harbor",
    synopsis:
      "En un puerto lunar, dos musicos rivales encuentran una conexion que cambia su destino.",
    genre: "Romance",
    status: "ongoing",
    releaseYear: 2024,
    rating: 4.6,
    coverImage:
      "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?auto=format&fit=crop&w=1200&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1515165562835-c4c1f7d68900?auto=format&fit=crop&w=1600&q=80",
    seasons: [
      {
        id: "lunar-s1",
        seasonNumber: 1,
        title: "Temporada 1",
        episodes: [
          {
            id: "lunar-s1-e1",
            episodeNumber: 1,
            title: "Primer acorde",
            durationMinutes: 22,
            synopsis: "Mira y Kaito se conocen durante una tormenta solar.",
            thumbnailImage:
              "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80",
            videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          }
        ]
      }
    ]
  },
  {
    slug: "neon-ronin",
    title: "Neon Ronin",
    synopsis:
      "Un samurai cibernetico persigue una red criminal en una megalopolis saturada de neones.",
    genre: "Sci-Fi",
    status: "ongoing",
    releaseYear: 2026,
    rating: 4.7,
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80",
    seasons: [
      {
        id: "neon-s1",
        seasonNumber: 1,
        title: "Temporada 1",
        episodes: [
          {
            id: "neon-s1-e1",
            episodeNumber: 1,
            title: "Codigo fantasma",
            durationMinutes: 25,
            synopsis: "Riku recibe un contrato imposible en el distrito cero.",
            thumbnailImage:
              "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
            videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          },
          {
            id: "neon-s1-e2",
            episodeNumber: 2,
            title: "Sombra en la lluvia",
            durationMinutes: 25,
            synopsis: "Una inteligencia artificial antigua reaparece en la red publica.",
            thumbnailImage:
              "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
            videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          }
        ]
      }
    ]
  }
];

export function getFallbackAnimeBySlug(slug: string) {
  return fallbackCatalog.find((anime) => anime.slug === slug) ?? null;
}
