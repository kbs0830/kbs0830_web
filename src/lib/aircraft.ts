// 航班機型紀錄——自己維護的航迷小筆記，不是自動產生的資料。
//
// key 是航班代碼（要對應 AboutSection.tsx 的 visitedCountries[].flights 裡已經有的代碼，
// 打錯或打一個不存在的代碼不會報錯，只是網站上不會顯示出來）。
// value 是機型，格式自由，想到什麼就填什麼，例如：
//   "A350-900"
//   "787-9（長榮彩繪機）"
//   "777-300ER"
//
// 想到就直接在下面加一行，存檔、push 上去（或本機重新 build）就會生效。
// 不知道某航班的機型就不用填，網站上會照舊只顯示航班代碼。

export const aircraftByFlight: Record<string, string> = {
  // "BR112": "A330-300",
};
