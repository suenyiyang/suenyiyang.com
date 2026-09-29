/**
 * The avatar mark, in the header and as the favicon — one illustration, served
 * from public/ so its URL stays stable for link unfurlers (see `links()` in
 * src/root.tsx).
 *
 * `logo.webp` is the whole avatar, scaled down by `pnpm icons`; the frame is
 * round here and the ring keeps the dark hair from melting into the dark page.
 */
export const Logo = () => {
  return (
    <span className="flex-none w-9 h-9 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/20">
      <img
        src="/logo.webp"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="w-full h-full"
      />
    </span>
  );
};
