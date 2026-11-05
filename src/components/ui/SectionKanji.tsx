// 首頁各區背景的直書大字（自己紹介／製作物／連絡先），淡到幾乎看不見，捲動時微微視差位移。
// 純 CSS（globals.css .section-kanji，scroll-driven animation），只在桌機顯示；section 要有 relative isolate。
export default function SectionKanji({ text }: { text: string }) {
  return (
    <span aria-hidden className="section-kanji font-serif">
      {text}
    </span>
  );
}
