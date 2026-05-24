export type ThemeMode = "light" | "dark" | "auto";

export type ThemeToggleTrigger = {
  clientX?: number;
  clientY?: number;
};

export const isDarkMode = () =>
  document.documentElement.classList.contains("dark");

export const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem("color-scheme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
};

const resolveIsDark = (mode: ThemeMode): boolean => {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const setThemeWithTransition = (
  mode: ThemeMode,
  trigger?: ThemeToggleTrigger
): boolean => {
  const htmlElement = document.documentElement;
  const currentIsDark = htmlElement.classList.contains("dark");
  const nextIsDark = resolveIsDark(mode);
  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsViewTransition =
    "startViewTransition" in document && !prefersReducedMotion;
  const visualChange = nextIsDark !== currentIsDark;

  const applyChange = () => {
    htmlElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem("color-scheme", mode);
  };

  if (!supportsViewTransition || !visualChange) {
    applyChange();
    return nextIsDark;
  }

  const x = trigger?.clientX ?? window.innerWidth / 2;
  const y = trigger?.clientY ?? window.innerHeight / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  htmlElement.style.setProperty("--vt-x", `${x}px`);
  htmlElement.style.setProperty("--vt-y", `${y}px`);
  htmlElement.style.setProperty("--vt-radius", `${endRadius}px`);
  htmlElement.dataset.themeTransition = nextIsDark ? "to-dark" : "to-light";

  (document as any).startViewTransition(() => {
    applyChange();
  })?.finished.finally(() => {
    htmlElement.style.removeProperty("--vt-x");
    htmlElement.style.removeProperty("--vt-y");
    htmlElement.style.removeProperty("--vt-radius");
    delete htmlElement.dataset.themeTransition;
  });

  return nextIsDark;
};
