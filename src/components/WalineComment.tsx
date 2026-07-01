import { useEffect, useRef, useState } from 'react';
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

  // Lazy-load: only fetch comments once the section nears the viewport. Most
  // visitors never scroll to the bottom, so this keeps the comment server idle
  // (and unbilled) for those visits instead of hitting it on every page load.
  const [inView, setInView] = useState(false);

  // Reset on SPA navigation so each post re-evaluates visibility from scratch.
  useEffect(() => {
    setInView(false);
  }, [postPath]);

  useEffect(() => {
    if (!shouldShowComment || inView || !containerRef.current) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // Start loading a bit early so comments are ready by the time the
      // section is actually on screen.
      { rootMargin: '400px 0px' },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldShowComment, inView, postPath]);

  // Initialize Waline once the section has come into view.
  useEffect(() => {
    if (!inView || !containerRef.current || !postPath) {
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
  }, [inView, isDark, postPath]);

  if (!shouldShowComment) {
    return null;
  }

  return <div className="not-prose mt-20" ref={containerRef} />;
};
