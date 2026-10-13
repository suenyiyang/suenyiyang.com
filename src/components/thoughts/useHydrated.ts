import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
const client = () => true;
const server = () => false;

/** Query/hash state is applied after hydration: static HTML cannot know either. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, client, server);
}
