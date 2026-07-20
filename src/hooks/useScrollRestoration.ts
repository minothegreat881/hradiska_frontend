import { useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'scrollpos:';

function saveScroll(pathname: string) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + pathname, String(window.scrollY));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — scroll restoration just won't work.
  }
}

function readScroll(pathname: string): number | null {
  try {
    const v = sessionStorage.getItem(STORAGE_PREFIX + pathname);
    return v ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}

// Disable the browser's own scroll restoration as early as possible so it
// doesn't fight with ours (native restoration fires before our data has
// loaded and gets overridden/undone once content pushes the page taller).
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * Restores scroll position on page refresh (F5) and browser back/forward,
 * keyed per pathname (sessionStorage — survives reload, not a new tab).
 *
 * Content on this site loads async (article body, images, category lists),
 * so the page often isn't tall enough yet to reach the saved position right
 * after mount. We retry for a couple seconds, only committing the scroll
 * once the document is tall enough to actually reach it (or after a final
 * timeout, so we don't wait forever on a page that never gets that tall).
 */
export function useScrollRestoration(pathname: string, shouldRestore: boolean) {
  const restoredFor = useRef<string | null>(null);

  // Continuously persist scroll position for the current path.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => saveScroll(pathname));
    };
    const onBeforeUnload = () => saveScroll(pathname);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('beforeunload', onBeforeUnload);
      saveScroll(pathname); // capture final position when navigating away internally
    };
  }, [pathname]);

  // Attempt to restore, retrying while content is still loading in.
  useEffect(() => {
    if (!shouldRestore) return;
    if (restoredFor.current === pathname) return;
    const target = readScroll(pathname);
    if (target == null || target <= 0) {
      restoredFor.current = pathname;
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12; // ~2.4s of retrying at 200ms

    const tryRestore = () => {
      if (cancelled) return;
      attempts++;
      const reachable = document.documentElement.scrollHeight - window.innerHeight >= target - 4;
      if (reachable || attempts >= maxAttempts) {
        window.scrollTo(0, target);
        restoredFor.current = pathname;
        return;
      }
      setTimeout(tryRestore, 200);
    };
    tryRestore();

    return () => {
      cancelled = true;
    };
  }, [pathname, shouldRestore]);
}
