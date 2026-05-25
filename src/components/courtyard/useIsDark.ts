import { useEffect, useState } from "react";

/**
 * Tracks whether the `dark` class is present on <html>. The blog's theme
 * toggle flips that class via View Transitions, so a class observer keeps
 * the 3D scene in lock-step without going through the jotai atom (which
 * is undefined until ToggleDark mounts).
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return isDark;
}
