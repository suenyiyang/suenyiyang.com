import { FC, useEffect, useState } from "react";

const SCROLL_THRESHOLD = 200;
const PROGRESS_RADIUS = 18;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export const BackToTop: FC = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setVisible(window.scrollY > SCROLL_THRESHOLD);
      setProgress(
        scrollableHeight > 0
          ? Math.min(Math.max(window.scrollY / scrollableHeight, 0), 1)
          : 0
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const onClick = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-(--reading-code-bg) text-text-secondary shadow-[0_4px_16px_rgba(16,15,15,0.08)] transition-[opacity,transform,color,box-shadow] duration-200 hover:-translate-y-0.5 hover:text-text-primary hover:shadow-[0_6px_20px_rgba(16,15,15,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0 motion-reduce:transition-none dark:text-text-secondary-dark dark:shadow-[0_4px_16px_rgba(0,0,0,0.24)] dark:hover:text-text-primary-dark ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "translate-y-2 opacity-0 pointer-events-none"
      }`}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full -rotate-90"
        fill="none"
        aria-hidden
      >
        <circle
          cx="20"
          cy="20"
          r={PROGRESS_RADIUS}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={PROGRESS_CIRCUMFERENCE}
          strokeDashoffset={PROGRESS_CIRCUMFERENCE * (1 - progress)}
          className="text-accent"
        />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
};
