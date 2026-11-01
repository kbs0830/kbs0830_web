// 文字連結底下的細線：平常是淡色底線，hover 時 accent 色從左邊畫過去。
// 原本 HeroSection 跟 ContactSection 各自寫了一份。外層元素要有 `group relative pb-2`。
export const underlineLinkClass =
  "group relative inline-flex items-center gap-2 pb-2 text-sm font-light tracking-wide transition-colors";

export default function Underline() {
  return (
    <>
      <span className="absolute left-0 bottom-0 h-px w-full bg-(--border)" />
      <span className="absolute left-0 bottom-0 h-px w-0 bg-(--accent) group-hover:w-full transition-all duration-500" />
    </>
  );
}
