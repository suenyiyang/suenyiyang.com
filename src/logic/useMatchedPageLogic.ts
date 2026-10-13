import { allPages } from "content-collections/generated";
import { useMemo } from "react";
import { type Location } from "react-router";
import { withoutTrailingSlash } from "~/utils/trailingSlash";

export const useMatchedPageLogic = (location: Location) => {
  const matchedPage = useMemo(() => {
    const pathname = withoutTrailingSlash(location.pathname);

    const match = allPages.find((page) => {
      return page._meta.path === pathname;
    });

    if (!match) {
      return null;
    }

    return match;
  }, [location]);

  return matchedPage;
};
