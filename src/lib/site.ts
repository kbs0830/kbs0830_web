// 全站共用的網址與聯絡方式。原本網址 16 處、email 5 處、GitHub 4 處散在各檔案逐字重複。
export const SITE_URL = "https://kbs0830.com";
export const EMAIL = "1394kbs@gmail.com";
export const GITHUB_URL = "https://github.com/kbs0830";
export const FACEBOOK_URL = "https://www.facebook.com/tra0830";
export const INSTAGRAM_URL = "https://www.instagram.com/pingwei_0830/";

// 結構化資料（JSON-LD）裡「這個人」的固定 ID：layout 的 Person、首頁的 ProfilePage、
// 文章的 author 都指向它，搜尋引擎才會把它們認成同一個人
export const PERSON_ID = `${SITE_URL}/#person`;
