import { FC, PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { useMatchedPageLogic } from "~/logic/useMatchedPageLogic";
import { PageMetadata } from "../PageMetadata";

export const PostWrapper: FC<PropsWithChildren> = (props) => {
  const { children } = props;

  const location = useLocation();
  const matchedPage = useMatchedPageLogic(location) ?? {};

  return (
    <>
      <PageMetadata metadata={matchedPage} />
      {children}
    </>
  );
};
