"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single fire-and-forget POST to record a page view when an article
 * mounts in the browser. The article pages are statically rendered (ISR), so
 * counting on the server would only happen on revalidation — tracking on the
 * client is what makes each real visit count.
 */
export function ArticleViewTracker({ slug }: { slug: string }) {
  // Guard against React's double-invoked effects in development StrictMode so a
  // single visit doesn't record two views.
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    void fetch(`/api/articles/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      // keepalive lets the request complete even if the user navigates away
      // immediately after the page loads.
      keepalive: true,
    }).catch(() => {
      // Tracking is best-effort; swallow network errors silently.
    });
  }, [slug]);

  return null;
}
