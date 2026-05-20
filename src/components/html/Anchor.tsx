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
      className={`${className ?? ""} no-underline border-b border-b-neutral-400/70 hover:border-b-text-primary dark:border-b-neutral-500/70 dark:hover:border-b-text-primary-dark transition-colors duration-200 ease-in-out`}
    >
      {children}
    </a>
  );
};
