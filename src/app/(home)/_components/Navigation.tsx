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
        className="overflow-hidden group py-1 capitalize font-bold tracking-tight"
      >
        {label}
      </Link>
    </ViewTransition>
  );
};

export const Navigation: FC = () => {
  return (
    <div className="fixed bottom-12 left-10 flex flex-col gap-2">
      {routes.map((route) => (
        <NavigationItem key={route.href} {...route} />
      ))}
    </div>
  );
};
