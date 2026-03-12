"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ContinueWatchingItem = {
  animeSlug: string;
  animeTitle: string;
  animeCoverImage: string;
  seasonNumber: number;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  completionPercent: number;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function ContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`${apiBase}/watch-progress/continue-watching`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ContinueWatchingItem[];
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch {
        return;
      }
    })();
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl sm:text-3xl">Continuar viendo</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.episodeId}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            href={`/anime/${item.animeSlug}/watch/${item.episodeId}`}
          >
            <div
              className="h-40 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.animeCoverImage})` }}
            />
            <div className="space-y-2 p-4">
              <h3 className="font-display text-xl">{item.animeTitle}</h3>
              <p className="text-sm text-brand-cream/80">
                T{item.seasonNumber} · E{item.episodeNumber} · {item.episodeTitle}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-brand-amber"
                  style={{ width: `${Math.max(0, Math.min(100, item.completionPercent))}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
