import { Link } from "react-router";

export function MobileNotice() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center md:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden />
      <div className="relative max-w-[280px] rounded-lg bg-[var(--reading-paper)] text-[var(--reading-text-primary)] p-5 text-center shadow-xl">
        <div className="font-display italic text-h3 mb-2">小院子</div>
        <p className="text-secondary text-text-secondary mb-4">
          本页面建议使用桌面浏览器访问。
        </p>
        <Link to="/" className="font-mono text-meta underline">
          回首页 →
        </Link>
      </div>
    </div>
  );
}
