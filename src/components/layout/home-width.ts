// 首頁所有區塊（NavBar、Hero、About、作品、記事、Contact、頁尾）共用的內容寬度，改這一個地方就全部一起變，左緣永遠同一條線。
// 2026-11-26：5xl→6xl（1152px）；大螢幕再分兩級（斷點在 globals.css）：1920 以上 7xl（1280px）、2400 以上 88rem（1408px）。
// 1920 以上 About／作品／記事／Contact 的標題跟內文也各大一級（各檔裡的 3xl: 字級）。
// 子頁面不跟這個走（PageShell 的 3xl 是閱讀寬度）。
export const HOME_WIDTH = "max-w-6xl 3xl:max-w-7xl 4xl:max-w-[88rem]";
