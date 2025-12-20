import { useEffect } from "react";
import { useLocation } from "react-router";

interface GoogleAnalyticsProps {
  gaId: string | undefined;
}

export const GoogleAnalytics = (props: GoogleAnalyticsProps) => {
  const { gaId } = props;

  const location = useLocation();

  useEffect(() => {
    if (!gaId) {
      return;
    }

    const gtag = (
      window as typeof window & {
        gtag?: (...args: unknown[]) => void;
      }
    ).gtag;

    if (!gtag) {
      return;
    }

    gtag("event", "page_view", {
      page_path: `${location.pathname}${location.search}${location.hash}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location, gaId]);

  return null;
};
