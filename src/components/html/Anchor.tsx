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
      className={`${className} no-underline border-b-[1px] border-b-neutral-400 hover:border-b-neutral-700 hover:dark:border-b-neutral-300 transition-colors duration-300 ease-in-out`}
    >
      {children}
    </a>
  );
};
