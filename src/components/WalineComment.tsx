import { useEffect, useRef } from 'react';
import { WalineInitOptions, type WalineInstance, init } from '@waline/client';

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
    if (!containerRef.current || !postPath) {
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

    if (!walineInstanceRef.current) {
      walineInstanceRef.current = init(params);
    } else {
      walineInstanceRef.current.update(params);
    }

    return () => {
      walineInstanceRef.current?.destroy();
      walineInstanceRef.current = null;
    };
  }, [isDark, postPath]);

  if (!shouldShowComment) {
    return null;
  }

  return <div className="not-prose mt-20" ref={containerRef} />;
};
