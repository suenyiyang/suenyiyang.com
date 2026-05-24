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
      className="inline-flex items-center rounded border border-border-light dark:border-border-dark p-0.5"
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
            className={`inline-flex items-center justify-center w-6 h-6 rounded-sm transition-colors cursor-pointer ${
              isActive
                ? "bg-border-light dark:bg-border-dark text-text-primary dark:text-text-primary-dark"
                : "text-text-muted dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark"
            }`}
          >
            <span className={`${option.icon} w-4 h-4`} />
          </button>
        );
      })}
    </div>
  );
};
