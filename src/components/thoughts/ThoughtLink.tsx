import { Link, useLocation, type LinkProps } from "react-router";

/** Carry the originating stream's filters through forward/backward thread hops. */
export function ThoughtLink(props: LinkProps) {
  const location = useLocation();
  const from =
    location.pathname.replace(/\/$/, "") === "/thoughts"
      ? location.pathname + location.search
      : location.state?.thoughtsFrom;
  return <Link {...props} state={{ ...props.state, thoughtsFrom: from }} />;
}

export function thoughtsReturnPath(state: unknown): string {
  const from = (state as { thoughtsFrom?: unknown } | null)?.thoughtsFrom;
  return typeof from === "string" && /^\/thoughts\/?(?:\?.*)?$/.test(from)
    ? from
    : "/thoughts";
}
