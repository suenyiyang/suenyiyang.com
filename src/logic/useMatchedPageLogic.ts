import { allPages } from "content-collections/generated";
import { useMemo } from "react";
import { type Location } from "react-router";

export const useMatchedPageLogic = (location: Location) => {
  const matchedPage = useMemo(() => {
    const pathname = location.pathname;

    const match = allPages.find((page) => page._meta.path === pathname);

    if (!match) {
      return null;
    }

    return match;
  }, [location]);

  return matchedPage;
};
