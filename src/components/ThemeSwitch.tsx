import { useAtom, useSetAtom } from "jotai";
import { type MouseEvent, useEffect } from "react";
import {
  getStoredThemeMode,
  isDarkMode,
  setThemeWithTransition,
  type ThemeMode,
} from "~/logic/themeToggle";
import { isDarkAtom, themeModeAtom } from "~/stores/theme";

const options: Array<{ mode: ThemeMode; icon: string; label: string }> = [
  { mode: "light", icon: "icon-[line-md--sunny-loop]", label: "Light theme" },
  { mode: "auto", icon: "icon-[line-md--monitor]", label: "System theme" },
  { mode: "dark", icon: "icon-[line-md--moon-loop]", label: "Dark theme" },
];

export const ThemeSwitch = () => {
  const [mode, setMode] = useAtom(themeModeAtom);
  const setIsDark = useSetAtom(isDarkAtom);

  useEffect(() => {
    setMode(getStoredThemeMode());
    setIsDark(isDarkMode());
  }, [setMode, setIsDark]);

  const selectMode = (
    nextMode: ThemeMode,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextIsDark = setThemeWithTransition(nextMode, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
    setMode(nextMode);
    setIsDark(nextIsDark);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full bg-[var(--reading-code-bg)] p-[3px]"
    >
      {options.map((option) => {
        const isActive = mode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            onClick={(event) => selectMode(option.mode, event)}
            className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-[color,background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--reading-accent)] ${
              isActive
                ? "bg-[var(--reading-paper)] text-text-primary shadow-[0_1px_3px_rgba(16,15,15,0.12)] ring-1 ring-black/[0.04] dark:text-text-primary-dark dark:ring-white/[0.06]"
                : "text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark"
            }`}
          >
            <span className={`${option.icon} w-4 h-4`} />
          </button>
        );
      })}
    </div>
  );
};
