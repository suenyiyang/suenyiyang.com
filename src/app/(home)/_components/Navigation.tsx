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
      <Link key={href} href={href}>
        <div className="capitalize">{label}</div>
      </Link>
    </ViewTransition>
  );
};

export const Navigation: FC = () => {
  return (
    <div>
      {routes.map((route) => (
        <NavigationItem key={route.href} {...route} />
      ))}
    </div>
  );
};
