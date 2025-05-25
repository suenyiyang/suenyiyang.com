import { useEffect, useState } from "react";

export const ToggleDark = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document !== undefined) {
      // Check initial dark mode
      const htmlElement = document.documentElement;
      setIsDark(htmlElement.classList.contains("dark"));
    }
  }, []);

  const onClick = () => {
    console.log(
      "%csrc/components/ToggleDark.tsx:15 111",
      "color: white; background-color: #26bfa5;",
      111
    );
    if (document !== undefined) {
      const htmlElement = document.documentElement;
      htmlElement.classList.toggle("dark");
      setIsDark(!isDark);
    }
  };

  return (
    <div
      className="inline-flex items-center gap-2 cursor-pointer"
      aria-label="Toggle dark mode"
      onClick={onClick}
    >
      {isDark ? (
        <span className="icon-[line-md--sun-rising-loop] w-6 h-6" />
      ) : (
        <span className="icon-[line-md--moon-loop] w-6 h-6" />
      )}
    </div>
  );
};
