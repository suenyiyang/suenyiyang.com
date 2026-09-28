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
      className={`${className ?? ""} text-accent dark:text-accent-dark no-underline hover:underline decoration-1 underline-offset-[0.28em] transition-colors duration-200 ease-in-out`}
    >
      {children}
    </a>
  );
};
