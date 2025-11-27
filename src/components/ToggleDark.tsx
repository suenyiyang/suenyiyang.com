import { type MouseEvent, useEffect, useState } from "react";
import {
  isDarkMode,
  toggleThemeWithTransition,
} from "~/logic/themeToggle";

export const ToggleDark = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode
    setIsDark(isDarkMode());
  }, []);

  const runTransition = (event: MouseEvent<HTMLDivElement>) => {
    const nextIsDark = toggleThemeWithTransition({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    setIsDark(nextIsDark);
  };

  return (
    <div
      className="inline-flex items-center gap-2 cursor-pointer"
      aria-label="Toggle dark mode"
      onClick={runTransition}
    >
      {isDark ? (
        <span className="icon-[line-md--sunny-loop] w-6 h-6" />
      ) : (
        <span className="icon-[line-md--moon-loop] w-6 h-6" />
      )}
    </div>
  );
};
