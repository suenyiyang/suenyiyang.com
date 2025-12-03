import type { Post } from "~/types/post";

export const getLangLabel = (lang: Post['lang']) => {
  switch(lang) {
    case 'zh': {
      return '中文';
    }
    default: {
      return;
    }
  }
};