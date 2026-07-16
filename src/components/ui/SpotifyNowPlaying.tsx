"use client";

import { useEffect, useState } from "react";

interface NowPlaying {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  albumArt?: string;
  url?: string;
}

export default function SpotifyNowPlaying() {
  const [data, setData] = useState<NowPlaying | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = () => {
      fetch("/api/spotify/now-playing")
        .then((res) => res.json())
        .then((d: NowPlaying) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    };
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data?.title) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 border border-(--border) rounded-sm bg-(--bg) hover:border-(--accent) transition-colors"
    >
      {data.albumArt && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.albumArt}
          alt=""
          className="w-10 h-10 rounded-sm object-cover shrink-0"
        />
      )}
      <div className="min-w-0">
        <p
          className="text-[10px] tracking-[0.2em] text-(--accent) uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {data.isPlaying ? "正在聽 · Now Playing" : "最近在聽 · Last Played"}
        </p>
        <p className="text-xs font-light text-(--text) truncate group-hover:text-(--accent) transition-colors">
          {data.title}
        </p>
        <p className="text-[11px] font-light text-(--muted) truncate">{data.artist}</p>
      </div>
    </a>
  );
}
