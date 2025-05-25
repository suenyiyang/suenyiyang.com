import { useEffect, useState } from "react";

export const ToggleDark = () => {
  const [isDark, setIsDark] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Check initial dark mode
    const htmlElement = document.documentElement;
    setIsDark(htmlElement.classList.contains("dark"));
  }, []);

  const onClick = () => {
    const htmlElement = document.documentElement;
    htmlElement.classList.toggle("dark");
    setIsDark(!isDark);
    setKey(key + 1);
  };

  return (
    <div
      className="inline-flex items-center gap-2 cursor-pointer"
      aria-label="Toggle dark mode"
      onClick={onClick}
    >
      {isDark ? (
        <span key={key} className="icon-[line-md--sun-rising-loop] w-6 h-6" />
      ) : (
        <span key={key} className="icon-[line-md--moon-loop] w-6 h-6" />
      )}
    </div>
  );
};
