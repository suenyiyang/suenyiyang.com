import { useAtom } from "jotai";
import { type MouseEvent, useEffect } from "react";
import {
  isDarkMode,
  toggleThemeWithTransition,
} from "~/logic/themeToggle";
import { isDarkAtom } from "~/stores/theme";

export const ToggleDark = () => {
  const [isDark, setIsDark] = useAtom(isDarkAtom);

  useEffect(() => {
    // Check initial dark mode
    setIsDark(isDarkMode());
  }, [setIsDark]);

  const runTransition = (event: MouseEvent<HTMLDivElement>) => {
    const nextIsDark = toggleThemeWithTransition({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    setIsDark(nextIsDark);
  };

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded border border-border-light dark:border-border-dark cursor-pointer"
      aria-label="Toggle dark mode"
      onClick={runTransition}
    >
      {isDark ? (
        <span className="icon-[line-md--sunny-loop] w-4 h-4 text-text-secondary dark:text-text-secondary-dark" />
      ) : (
        <span className="icon-[line-md--moon-loop] w-4 h-4 text-text-secondary dark:text-text-secondary-dark" />
      )}
    </div>
  );
};
