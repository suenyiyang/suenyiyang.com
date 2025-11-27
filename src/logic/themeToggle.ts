export type ThemeToggleTrigger = {
  clientX?: number;
  clientY?: number;
};

const persistPreference = (htmlElement: HTMLElement) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const darkIsActive = htmlElement.classList.contains("dark");

  if ((prefersDark && darkIsActive) || (prefersLight && !darkIsActive)) {
    localStorage.setItem("color-scheme", "auto");
  } else if (prefersDark && !darkIsActive) {
    localStorage.setItem("color-scheme", "light");
  } else {
    localStorage.setItem("color-scheme", "dark");
  }
};

export const isDarkMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export const toggleThemeWithTransition = (
  trigger?: ThemeToggleTrigger
): boolean => {
  const htmlElement = document.documentElement;
  const currentIsDark = htmlElement.classList.contains("dark");
  const nextIsDark = !currentIsDark;
  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsViewTransition =
    "startViewTransition" in document && !prefersReducedMotion;

  const runToggle = () => {
    htmlElement.classList.toggle("dark", nextIsDark);
    persistPreference(htmlElement);
  };

  if (!supportsViewTransition) {
    runToggle();
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

  (document as any).startViewTransition(() => {
    runToggle();
  })?.finished.finally(() => {
    htmlElement.style.removeProperty("--vt-x");
    htmlElement.style.removeProperty("--vt-y");
    htmlElement.style.removeProperty("--vt-radius");
  });

  return nextIsDark;
};
