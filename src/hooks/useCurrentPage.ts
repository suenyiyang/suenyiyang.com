"use client";

import { usePathname } from "next/navigation";

export const useCurrentPageId = () => {
  const pathname = usePathname();

  console.log(
    "%csrc/hooks/useCurrentPage.ts:8 pathname",
    "color: white; background-color: #26bfa5;",
    pathname
  );

  return pathname || "home";
};
