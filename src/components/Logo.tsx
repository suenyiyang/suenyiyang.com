/**
 * The avatar mark, in the header and as the favicon — one file, served from
 * public/ so its URL stays stable for link unfurlers (see `links()` in
 * src/root.tsx). It carries its own colours, so unlike the previous
 * monochrome glyph it doesn't follow `text-primary`.
 *
 * The illustration is a full-bleed portrait; at 36px the whole figure reads
 * as a smudge, so the circle is zoomed onto the head (scale + transform
 * origin). The ring keeps the dark hair from melting into the dark page.
 */
export const Logo = () => {
  return (
    <span className="flex-none w-9 h-9 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/20">
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="w-full h-full origin-[50%_37%] scale-[1.5]"
      />
    </span>
  );
};
