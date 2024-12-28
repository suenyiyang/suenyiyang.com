import { FC, PropsWithChildren } from "react";
import { Header } from "../Header";

export const BlogLayout: FC<PropsWithChildren> = (props) => {
  const { children } = props;

  return (
    <div className="flex flex-col">
      <Header />
      <main>{children}</main>
    </div>
  );
};
