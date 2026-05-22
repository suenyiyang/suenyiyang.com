import { FC } from "react";

interface TagProps {
  label: string;
  variant?: "default" | "filter";
  isActive?: boolean;
  onClick?: () => void;
}

export const Tag: FC<TagProps> = ({
  label,
  variant = "default",
  isActive = false,
  onClick,
}) => {
  if (variant === "filter") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`font-mono text-meta px-3 py-1.5 rounded-full transition-colors ${
          isActive
            ? "bg-text-primary dark:bg-text-primary-dark text-bg-light dark:text-bg-dark border border-text-primary dark:border-text-primary-dark"
            : "bg-transparent text-text-secondary dark:text-text-secondary-dark border border-[var(--reading-rule)] hover:border-text-muted"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="font-mono text-tag px-[10px] py-1 rounded-full border border-[var(--reading-rule)] text-text-secondary dark:text-text-secondary-dark">
      {label}
    </span>
  );
};
