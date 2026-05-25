import { Link } from "react-router";

export function MobileNotice() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center md:hidden">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" aria-hidden />
      <div className="relative max-w-[300px] rounded-xl border border-[var(--reading-rule)] bg-[var(--reading-paper)] text-[var(--reading-text-primary)] p-6 text-center shadow-[0_20px_60px_-15px_rgba(20,15,8,0.45)]">
        <div className="font-mono text-eyebrow font-bold tracking-[0.18em] uppercase text-[var(--reading-text-muted)] mb-2">
          Courtyard
        </div>
        <div className="font-display italic text-h3 text-[var(--reading-text-primary)] mb-2">
          小院子
        </div>
        <p className="text-secondary text-[var(--reading-text-secondary)] leading-[1.55] mb-5">
          这里需要键盘操作 —— 建议在桌面浏览器里逛一逛。
        </p>
        <Link
          to="/"
          className="inline-block font-mono text-meta text-[var(--reading-text-primary)] border-b border-[var(--reading-text-primary)]/40 hover:border-[var(--reading-text-primary)] transition-colors"
        >
          回首页 →
        </Link>
      </div>
    </div>
  );
}
