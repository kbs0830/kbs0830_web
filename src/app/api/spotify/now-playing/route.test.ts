import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setSpotifyEnv() {
  process.env.SPOTIFY_CLIENT_ID = "client-id";
  process.env.SPOTIFY_CLIENT_SECRET = "client-secret";
  process.env.SPOTIFY_REFRESH_TOKEN = "refresh-token";
}

describe("GET /api/spotify/now-playing", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("缺任一個 Spotify 環境變數就直接回傳 isPlaying:false，不打 API", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REFRESH_TOKEN;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body).toEqual({ isPlaying: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refresh token 換不到 access token 時回傳 isPlaying:false", async () => {
    setSpotifyEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 400 })));

    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body).toEqual({ isPlaying: false });
  });

  it("正在播放時回傳歌名、歌手、最小張的專輯圖、連結", async () => {
    setSpotifyEnv();
    const track = {
      name: "曲名",
      artists: [{ name: "歌手A" }, { name: "歌手B" }],
      album: { images: [{ url: "big.jpg" }, { url: "small.jpg" }] },
      external_urls: { spotify: "https://open.spotify.com/track/xxx" },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ is_playing: true, item: track }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body).toEqual({
      isPlaying: true,
      title: "曲名",
      artist: "歌手A, 歌手B",
      albumArt: "small.jpg",
      url: "https://open.spotify.com/track/xxx",
    });
  });

  it("目前沒在播放時 fallback 到最近播放紀錄，isPlaying 為 false", async () => {
    setSpotifyEnv();
    const track = {
      name: "上一首",
      artists: [{ name: "歌手" }],
      album: { images: [{ url: "art.jpg" }] },
      external_urls: { spotify: "https://open.spotify.com/track/yyy" },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ track }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body.isPlaying).toBe(false);
    expect(body.title).toBe("上一首");
  });

  it("呼叫 Spotify API 時網路出錯會被 catch 住，回傳 isPlaying:false 而不是丟出例外", async () => {
    setSpotifyEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 }))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const body = await (await GET()).json();

    expect(body).toEqual({ isPlaying: false });
  });
});
