import { useEffect, useRef, useState } from 'react';
import {
  type WalineInstance,
  type WalineInitOptions,
  init,
} from '@waline/client';

import '@waline/client/style';
import { Page } from 'content-collections/generated';
import { useAtomValue } from 'jotai';
import { isDarkAtom } from '~/stores/theme';

interface WalineCommentProps {
  matchedPage: Page | null;
}

export const WalineComment = (props: WalineCommentProps) => {
  const { matchedPage } = props;

  const walineInstanceRef = useRef<WalineInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const isDark = useAtomValue(isDarkAtom);
  const postPath = matchedPage?._meta.path;
  const shouldShowComment = matchedPage?.comment === true && Boolean(postPath);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !shouldShowComment || !containerRef.current) {
      return;
    }

    const params: WalineInitOptions = {
      el: containerRef.current,
      path: postPath,
      serverURL: __INJECTED_WALINE_SERVER_URL__ ?? '/',
      dark: isDark,
      noCopyright: true,
      requiredMeta: ['nick', 'mail'],
    };

    // 未初始化
    if (!walineInstanceRef.current && postPath) {
      walineInstanceRef.current = init(params);
    } else {
      walineInstanceRef.current?.update(params);
    }

    return () => {
      walineInstanceRef.current?.destroy();
      walineInstanceRef.current = null;
    };
  }, [isDark, isMounted, postPath, shouldShowComment]);

  if (!shouldShowComment) {
    return null;
  }

  if (!isMounted) {
    return (
      <div className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading comments...
      </div>
    );
  }

  return <div className="not-prose" ref={containerRef} />;
};
