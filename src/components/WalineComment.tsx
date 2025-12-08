import { useEffect, useRef } from 'react';
import { type WalineInstance, init } from '@waline/client';

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
  const isDark = useAtomValue(isDarkAtom);
  const postPath = matchedPage?._meta.path;
  const shouldShowComment = matchedPage?.comment === true && Boolean(postPath);

  // Initialize Waline
  useEffect(() => {
    if (!shouldShowComment || !containerRef.current || !postPath) {
      return;
    }

    // Only initialize if not already initialized
    if (!walineInstanceRef.current) {
      walineInstanceRef.current = init({
        el: containerRef.current,
        path: postPath,
        serverURL: __INJECTED_WALINE_SERVER_URL__ ?? '/',
        dark: isDark,
        noCopyright: true,
        requiredMeta: ['nick', 'mail'],
      });
    }

    // Cleanup only on unmount
    return () => {
      walineInstanceRef.current?.destroy();
      walineInstanceRef.current = null;
    };
  }, [shouldShowComment, postPath]);

  // Update dark mode separately without destroying instance
  useEffect(() => {
    if (walineInstanceRef.current && isDark !== undefined) {
      walineInstanceRef.current.update({ dark: isDark });
    }
  }, [isDark]);

  if (!shouldShowComment) {
    return null;
  }

  return <div className="not-prose" ref={containerRef} />;
};
