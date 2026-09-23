import { AnchorHTMLAttributes } from "react";

export const Anchor: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = (
  props
) => {
  const { children, className, href, ...rest } = props;

  const isExternal = href?.startsWith("http");

  return (
    <a
      {...rest}
      target={isExternal ? "_blank" : undefined}
      href={href}
      className={`${className ?? ""} underline decoration-1 underline-offset-[0.28em] decoration-accent/55 hover:text-accent hover:decoration-accent dark:decoration-accent-dark/55 dark:hover:text-accent-dark dark:hover:decoration-accent-dark transition-colors duration-200 ease-in-out`}
    >
      {children}
    </a>
  );
};
