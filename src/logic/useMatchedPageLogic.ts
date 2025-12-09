import { allPages } from "content-collections/generated";
import { useMemo } from "react";
import { type Location } from "react-router";

export const useMatchedPageLogic = (location: Location) => {
  const matchedPage = useMemo(() => {
    const pathname = location.pathname;

    const match = allPages.find((page) => {
      const normalizedPathname = pathname === '/' ? pathname : pathname.replace(/\/?$/, '');
      return page._meta.path === normalizedPathname;
    });

    if (!match) {
      return null;
    }

    return match;
  }, [location]);

  return matchedPage;
};
