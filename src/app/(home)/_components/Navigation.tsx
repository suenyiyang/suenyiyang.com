"use client";

import Link from "next/link";
import { FC, unstable_ViewTransition as ViewTransition } from "react";
import { useSelectedPage } from "../_hooks/useSelectedPage";
import { Route, routes } from "../routes";

const NavigationItem: FC<Route> = (props) => {
  const { href, label } = props;

  const segment = useSelectedPage();

  if (label === segment) {
    return null;
  }

  return (
    <ViewTransition name={label}>
      <Link
        key={href}
        href={href}
        className="block capitalize font-bold text-2xl"
      >
        {label}
      </Link>
    </ViewTransition>
  );
};

export const Navigation: FC = () => {
  return (
    <div className="fixed bottom-20 left-20 flex flex-col gap-4">
      {routes.map((route) => (
        <NavigationItem key={route.href} {...route} />
      ))}
    </div>
  );
};
