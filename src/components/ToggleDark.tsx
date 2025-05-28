import { useEffect, useState } from "react";

export const ToggleDark = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode
    const htmlElement = document.documentElement;
    setIsDark(htmlElement.classList.contains("dark"));
  }, []);

  const onClick = () => {
    const htmlElement = document.documentElement;
    htmlElement.classList.toggle("dark");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;

    if (
      (prefersDark && htmlElement.classList.contains("dark")) ||
      (prefersLight && !htmlElement.classList.contains("dark"))
    ) {
      localStorage.setItem("color-scheme", "auto");
    } else if (prefersDark && !htmlElement.classList.contains("dark")) {
      localStorage.setItem("color-scheme", "light");
    } else {
      localStorage.setItem("color-scheme", "dark");
    }

    setIsDark(!isDark);
  };

  return (
    <div
      className="inline-flex items-center gap-2 cursor-pointer"
      aria-label="Toggle dark mode"
      onClick={onClick}
    >
      {isDark ? (
        <span className="icon-[line-md--sunny-loop] w-6 h-6" />
      ) : (
        <span className="icon-[line-md--moon-loop] w-6 h-6" />
      )}
    </div>
  );
};
