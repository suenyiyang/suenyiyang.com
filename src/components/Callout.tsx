import type { FC, PropsWithChildren } from "react";

export type CalloutColor =
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "theme";

type CalloutProps = PropsWithChildren<{
  emoji?: string;
  color?: CalloutColor;
}>;

const COLOR_STYLES: Record<CalloutColor, string> = {
  gray: "bg-neutral-100/70 dark:bg-neutral-800/40 border-border-light dark:border-border-dark",
  red: "bg-red-50 dark:bg-red-950/30 border-red-200/70 dark:border-red-900/50",
  orange:
    "bg-orange-50 dark:bg-orange-950/30 border-orange-200/70 dark:border-orange-900/50",
  yellow:
    "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/70 dark:border-yellow-900/50",
  green:
    "bg-green-50 dark:bg-green-950/30 border-green-200/70 dark:border-green-900/50",
  blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/50",
  purple:
    "bg-purple-50 dark:bg-purple-950/30 border-purple-200/70 dark:border-purple-900/50",
  theme: "bg-[#F1ECDB] dark:bg-[#2A251D] border-[#DCCFAB] dark:border-[#3F3727]",
};

export const Callout: FC<CalloutProps> = ({
  emoji = "💡",
  color = "gray",
  children,
}) => {
  return (
    <aside
      className={`not-prose my-6 flex items-start gap-3 rounded-lg border px-4 py-3 ${COLOR_STYLES[color]}`}
    >
      <span
        className="flex-shrink-0 select-none text-[18px] leading-[1.75]"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1 text-[16px] leading-[1.75] text-text-body dark:text-text-body-dark space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:my-1 [&_code]:font-mono [&_code]:text-[13px] [&_code]:rounded [&_code]:bg-neutral-200/70 dark:[&_code]:bg-neutral-700/50 [&_code]:px-1 [&_strong]:font-semibold [&_strong]:text-text-primary dark:[&_strong]:text-text-primary-dark">
        {children}
      </div>
    </aside>
  );
};
