import { FC, PropsWithChildren } from "react";

export const ContentLayout: FC<PropsWithChildren> = (props) => {
  const { children } = props;
  return <div className="px-8">{children}</div>;
};
