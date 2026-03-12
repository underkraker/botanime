"use client";

import { FormEvent, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type CreateMode = "anime" | "season" | "episode";

type DetectResponse = {
  confidence: number;
  anime: {
    title: string;
    slug: string;
    synopsis: string;
    releaseYear: number;
    coverImage: string;
    bannerImage: string;
  };
  season: {
    seasonNumber: number;
    title: string;
  };
  episode: {
    title: string;
    episodeNumber: number;
    synopsis: string;
    thumbnailImage: string;
    videoUrl: string;
  };
};

export default function AdminPage() {
  const [mode, setMode] = useState<CreateMode>("anime");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectLoading, setDetectLoading] = useState(false);
  const [sourceLink, setSourceLink] = useState("");

  const [anime, setAnime] = useState({
    slug: "",
    title: "",
    synopsis: "",
    genre: "",
    coverImage: "",
    bannerImage: "",
    releaseYear: String(new Date().getFullYear()),
    rating: "4.5"
  });
  const [season, setSeason] = useState({ animeId: "", seasonNumber: "1", title: "" });
  const [episode, setEpisode] = useState({
    seasonId: "",
    episodeNumber: "1",
    title: "",
    synopsis: "",
    durationMinutes: "24",
    thumbnailImage: "",
    videoUrl: ""
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      setMessage("Debes iniciar sesion como admin.");
      return;
    }

    let path = "";
    let payload: Record<string, string | number> = {};

    if (mode === "anime") {
      path = "/catalog/admin/animes";
      payload = {
        slug: anime.slug,
        title: anime.title,
        synopsis: anime.synopsis,
        genre: anime.genre,
        coverImage: anime.coverImage,
        bannerImage: anime.bannerImage,
        releaseYear: Number(anime.releaseYear),
        rating: Number(anime.rating)
      };
    }

    if (mode === "season") {
      path = "/catalog/admin/seasons";
      payload = {
        animeId: season.animeId,
        seasonNumber: Number(season.seasonNumber),
        title: season.title
      };
    }

    if (mode === "episode") {
      path = "/catalog/admin/episodes";
      payload = {
        seasonId: episode.seasonId,
        episodeNumber: Number(episode.episodeNumber),
        title: episode.title,
        synopsis: episode.synopsis,
        durationMinutes: Number(episode.durationMinutes),
        thumbnailImage: episode.thumbnailImage,
        videoUrl: episode.videoUrl
      };
    }

    try {
      const response = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = (await response.json()) as { message?: string | string[]; id?: string };
      if (!response.ok) {
        const err = Array.isArray(json.message) ? json.message.join(", ") : json.message;
        throw new Error(err ?? "No se pudo crear el recurso");
      }

      setMessage(`Creado correctamente (${mode}) id: ${json.id ?? "ok"}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const detectFromLink = async () => {
    setMessage("");

    if (!sourceLink.trim()) {
      setMessage("Pega primero un link para detectar metadata.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessage("Debes iniciar sesion como admin.");
      return;
    }

    setDetectLoading(true);
    try {
      const response = await fetch(`${apiBase}/catalog/admin/detect-from-link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: sourceLink.trim() })
      });

      const json = (await response.json()) as DetectResponse | { message?: string | string[] };
      if (!response.ok || !("anime" in json)) {
        const maybeError = "message" in json ? json.message : "No se pudo detectar metadata";
        const errorMessage = Array.isArray(maybeError) ? maybeError.join(", ") : maybeError;
        throw new Error(errorMessage || "No se pudo detectar metadata");
      }

      const detected = json as DetectResponse;

      setAnime((current) => ({
        ...current,
        slug: detected.anime.slug || current.slug,
        title: detected.anime.title || current.title,
        synopsis: detected.anime.synopsis || current.synopsis,
        coverImage: detected.anime.coverImage || current.coverImage,
        bannerImage: detected.anime.bannerImage || current.bannerImage,
        releaseYear: String(detected.anime.releaseYear || Number(current.releaseYear) || new Date().getFullYear())
      }));

      setSeason((current) => ({
        ...current,
        seasonNumber: String(detected.season.seasonNumber || Number(current.seasonNumber) || 1),
        title: detected.season.title || current.title
      }));

      setEpisode((current) => ({
        ...current,
        episodeNumber: String(detected.episode.episodeNumber || Number(current.episodeNumber) || 1),
        title: detected.episode.title || current.title,
        synopsis: detected.episode.synopsis || current.synopsis,
        thumbnailImage: detected.episode.thumbnailImage || current.thumbnailImage,
        videoUrl: detected.episode.videoUrl || current.videoUrl
      }));

      setMessage(`Detectado con confianza ${(detected.confidence * 100).toFixed(0)}%. Revisa y guarda.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error detectando link");
    } finally {
      setDetectLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#061427] via-[#0a2746] to-[#061427] px-4 py-10 text-brand-cream sm:px-8">
      <section className="mx-auto max-w-4xl rounded-3xl border border-white/15 bg-white/5 p-4 shadow-glow backdrop-blur-sm sm:p-8">
        <h1 className="font-display text-3xl sm:text-4xl">Panel admin</h1>
        <p className="mt-2 text-sm text-brand-cream/85">
          Alta rapida de animes, temporadas y episodios para poblar la plataforma.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-full bg-white/10 p-1 text-sm">
          <button
            className={`rounded-full px-3 py-2 ${mode === "anime" ? "bg-brand-amber text-[#2a1a07]" : ""}`}
            onClick={() => setMode("anime")}
            type="button"
          >
            Anime
          </button>
          <button
            className={`rounded-full px-3 py-2 ${mode === "season" ? "bg-brand-amber text-[#2a1a07]" : ""}`}
            onClick={() => setMode("season")}
            type="button"
          >
            Temporada
          </button>
          <button
            className={`rounded-full px-3 py-2 ${mode === "episode" ? "bg-brand-amber text-[#2a1a07]" : ""}`}
            onClick={() => setMode("episode")}
            type="button"
          >
            Episodio
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-brand-sky/40 bg-brand-sky/10 p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-sky">Deteccion inteligente</p>
          <p className="mt-1 text-sm text-brand-cream/85">
            Pega un link del anime o episodio y el sistema intenta detectar titulo, sinopsis, anio,
            temporada, capitulo e imagenes automaticamente.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-brand-cream outline-none ring-brand-sky transition focus:ring-2"
              onChange={(event) => setSourceLink(event.target.value)}
              placeholder="https://sitio.com/anime/episodio-12"
              value={sourceLink}
            />
            <button
              className="rounded-xl bg-brand-sky px-4 py-2 text-sm font-semibold text-[#05253a] disabled:opacity-60"
              disabled={detectLoading}
              onClick={detectFromLink}
              type="button"
            >
              {detectLoading ? "Detectando..." : "Autocompletar"}
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          {mode === "anime" ? (
            <>
              <Input label="Slug" value={anime.slug} onChange={(value) => setAnime({ ...anime, slug: value })} />
              <Input label="Titulo" value={anime.title} onChange={(value) => setAnime({ ...anime, title: value })} />
              <Input
                label="Sinopsis"
                value={anime.synopsis}
                onChange={(value) => setAnime({ ...anime, synopsis: value })}
              />
              <Input label="Genero" value={anime.genre} onChange={(value) => setAnime({ ...anime, genre: value })} />
              <Input
                label="Cover image URL"
                value={anime.coverImage}
                onChange={(value) => setAnime({ ...anime, coverImage: value })}
              />
              <Input
                label="Banner image URL"
                value={anime.bannerImage}
                onChange={(value) => setAnime({ ...anime, bannerImage: value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Release year"
                  value={anime.releaseYear}
                  onChange={(value) => setAnime({ ...anime, releaseYear: value })}
                />
                <Input
                  label="Rating"
                  value={anime.rating}
                  onChange={(value) => setAnime({ ...anime, rating: value })}
                />
              </div>
            </>
          ) : null}

          {mode === "season" ? (
            <>
              <Input
                label="Anime ID"
                value={season.animeId}
                onChange={(value) => setSeason({ ...season, animeId: value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Season number"
                  value={season.seasonNumber}
                  onChange={(value) => setSeason({ ...season, seasonNumber: value })}
                />
                <Input
                  label="Titulo"
                  value={season.title}
                  onChange={(value) => setSeason({ ...season, title: value })}
                />
              </div>
            </>
          ) : null}

          {mode === "episode" ? (
            <>
              <Input
                label="Season ID"
                value={episode.seasonId}
                onChange={(value) => setEpisode({ ...episode, seasonId: value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Episode number"
                  value={episode.episodeNumber}
                  onChange={(value) => setEpisode({ ...episode, episodeNumber: value })}
                />
                <Input
                  label="Duracion (min)"
                  value={episode.durationMinutes}
                  onChange={(value) => setEpisode({ ...episode, durationMinutes: value })}
                />
              </div>
              <Input
                label="Titulo"
                value={episode.title}
                onChange={(value) => setEpisode({ ...episode, title: value })}
              />
              <Input
                label="Sinopsis"
                value={episode.synopsis}
                onChange={(value) => setEpisode({ ...episode, synopsis: value })}
              />
              <Input
                label="Thumbnail URL"
                value={episode.thumbnailImage}
                onChange={(value) => setEpisode({ ...episode, thumbnailImage: value })}
              />
              <Input
                label="Video URL (HLS)"
                value={episode.videoUrl}
                onChange={(value) => setEpisode({ ...episode, videoUrl: value })}
              />
            </>
          ) : null}

          <button
            className="w-full rounded-xl bg-brand-amber px-4 py-2 text-sm font-semibold text-[#2a1a07] disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Guardando..." : "Crear"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-brand-cream/90">{message}</p> : null}
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-brand-cream outline-none ring-brand-sky transition focus:ring-2"
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      />
    </label>
  );
}
