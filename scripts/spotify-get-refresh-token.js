// 一次性小工具：用授權碼跟 Spotify 換 refresh token，寫進 .env.local。
// 用法：
//   1. 先在 .env.local 填好 SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
//   2. node scripts/spotify-get-refresh-token.js
//      → 印出一個 Spotify 授權網址，打開瀏覽器登入、按同意
//   3. 同意後會被導到 https://kbs0830.com/?code=xxxxx，
//      從網址列複製 code= 後面那一串（先別關分頁，code 幾分鐘內就會過期）
//   4. node scripts/spotify-get-refresh-token.js <code>
//      → 換到的 refresh token 會直接寫進 .env.local，不會印在畫面上

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const REDIRECT_URI = "https://kbs0830.com/";
const SCOPES = "user-read-currently-playing user-read-recently-played";

function readEnv() {
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

function writeEnvVar(key, value) {
  let lines = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8").split("\n")
    : [];
  let found = false;
  lines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) lines.push(`${key}=${value}`);
  fs.writeFileSync(envPath, lines.filter((l, i, arr) => l !== "" || i !== arr.length - 1).join("\n") + "\n");
}

async function main() {
  const env = readEnv();
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("先在 .env.local 填好 SPOTIFY_CLIENT_ID 和 SPOTIFY_CLIENT_SECRET，再跑這支 script。");
    process.exit(1);
  }

  const code = process.argv[2];

  if (!code) {
    const authUrl =
      "https://accounts.spotify.com/authorize?" +
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
      }).toString();
    console.log("\n打開這個網址登入並同意授權：\n");
    console.log(authUrl);
    console.log(
      "\n同意後會被導到 https://kbs0830.com/?code=xxxx，複製 code 參數的值，" +
        "然後重新執行：\n  node scripts/spotify-get-refresh-token.js <code>\n"
    );
    return;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  const data = await res.json();

  if (!res.ok || !data.refresh_token) {
    console.error("換 token 失敗：", data);
    console.error("常見原因：code 已過期（要在幾分鐘內用掉）或 redirect_uri 不一致，回到步驟 1 重新取得一次新的 code。");
    process.exit(1);
  }

  writeEnvVar("SPOTIFY_REFRESH_TOKEN", data.refresh_token);
  console.log("\n成功！refresh token 已經寫進 .env.local（沒有印在這裡，避免外流）。");
  console.log("重啟 dev server / production server 後，Spotify 小工具就會開始運作。\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
