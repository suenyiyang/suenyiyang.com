"use client";

import { useThemeStore } from "@/logic/theme";
import { LucideProps, Moon, Sun } from "lucide-react";
import { FC, useEffect } from "react";

export const ToggleDark: FC = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const { toggleDarkMode, initThemeStore } = useThemeStore(
    (state) => state.actions
  );
  const iconProps: LucideProps = {
    width: 24,
    height: 24,
    color: "#FFB800",
  };

  useEffect(() => {
    initThemeStore();
  }, []);

  return (
    <button className="text-sm" onClick={toggleDarkMode}>
      {isDark ? <Sun {...iconProps} /> : <Moon {...iconProps} />}
    </button>
  );
};
