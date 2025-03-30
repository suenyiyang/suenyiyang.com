"use client";

import { FC, unstable_ViewTransition as ViewTransition } from "react";
import { useSelectedPage } from "../_hooks/useSelectedPage";

export const PageTitle: FC = () => {
  const segment = useSelectedPage();

  return (
    <ViewTransition name={segment}>
      <h1 className="block relative capitalize text-4xl font-bold">
        {segment}
      </h1>
    </ViewTransition>
  );
};
