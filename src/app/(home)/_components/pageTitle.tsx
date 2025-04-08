"use client";

import { FC, unstable_ViewTransition as ViewTransition } from "react";
import { useSelectedPage } from "../_hooks/useSelectedPage";

export const PageTitle: FC = () => {
  const segment = useSelectedPage();

  return (
    <ViewTransition name={segment}>
      <div className="absolute right-0 text-4xl font-bold tracking-tight capitalize">
        {segment}
      </div>
    </ViewTransition>
  );
};
