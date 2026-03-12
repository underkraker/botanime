"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef } from "react";

type EpisodePlayerProps = {
  episodeId: string;
  src: string;
  poster: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function EpisodePlayer({ episodeId, src, poster }: EpisodePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastReportedSecondRef = useRef<number>(0);

  const localKey = useMemo(() => `progress:${episodeId}`, [episodeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    let hls: Hls | null = null;

    if (src.endsWith(".m3u8") && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    const saved = localStorage.getItem(localKey);
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed > 0) {
        video.currentTime = parsed;
      }
    }

    return () => {
      hls?.destroy();
    };
  }, [localKey, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const reportProgress = async (force: boolean) => {
      const token = localStorage.getItem("accessToken");
      const current = Math.floor(video.currentTime || 0);
      const duration = Math.floor(video.duration || 0);

      localStorage.setItem(localKey, String(current));

      if (!token) {
        return;
      }

      if (!force && current - lastReportedSecondRef.current < 5) {
        return;
      }

      lastReportedSecondRef.current = current;

      try {
        await fetch(`${apiBase}/watch-progress/episode/${episodeId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            positionSeconds: current,
            durationSeconds: duration,
            isCompleted: duration > 0 ? current / duration >= 0.95 : false
          })
        });
      } catch {
        return;
      }
    };

    const onTimeUpdate = () => {
      void reportProgress(false);
    };

    const onPause = () => {
      void reportProgress(true);
    };

    const onEnded = () => {
      void reportProgress(true);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [episodeId, localKey]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full rounded-2xl bg-black"
      controls
      poster={poster}
      playsInline
      preload="metadata"
    />
  );
}
