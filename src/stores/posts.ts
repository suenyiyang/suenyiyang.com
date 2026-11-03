import { atom } from "jotai";

/**
 * Tag filter for the posts list. Lives in a store rather than component state
 * so the `page_filter_posts_by_tag` WebMCP tool and the tag chips drive the same
 * state instead of two sources of truth.
 */
export const activeTagAtom = atom<string | null>(null);
