import { FC, PropsWithChildren } from "react";

export const ContentLayout: FC<PropsWithChildren> = (props) => {
  const { children } = props;
  return <div className="px-8 md:px-40 py-8 flex">{children}</div>;
};
