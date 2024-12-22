import { FC, PropsWithChildren } from "react";

export const DivLayout: FC<PropsWithChildren> = (props) => {
  const { children } = props;

  return <div>{children}</div>;
};
