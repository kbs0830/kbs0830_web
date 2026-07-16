import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SpotifyArtist {
  name: string;
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

function toPayload(track: SpotifyTrack, isPlaying: boolean) {
  return {
    isPlaying,
    title: track.name,
    artist: track.artists?.map((a) => a.name).join(", ") ?? "",
    albumArt: track.album?.images?.[track.album.images.length - 1]?.url ?? track.album?.images?.[0]?.url,
    url: track.external_urls?.spotify,
  };
}

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ isPlaying: false });
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    const nowRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers,
      cache: "no-store",
    });

    if (nowRes.status === 200) {
      const data = await nowRes.json();
      if (data?.item) {
        return NextResponse.json(toPayload(data.item, Boolean(data.is_playing)));
      }
    }

    const recentRes = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers,
      cache: "no-store",
    });
    if (recentRes.ok) {
      const data = await recentRes.json();
      const track = data?.items?.[0]?.track;
      if (track) {
        return NextResponse.json(toPayload(track, false));
      }
    }
  } catch {
    // Spotify API 暫時打不到就當作沒資料，前端元件不顯示
  }

  return NextResponse.json({ isPlaying: false });
}
