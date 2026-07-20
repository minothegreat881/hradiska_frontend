import { useEffect, useState } from 'react';

/**
 * This app has no router — App.tsx does its own window.history.pushState +
 * click-interception. There's no event fired on pushState, so we listen for
 * popstate (back/forward) and for clicks (App.tsx's handler runs pushState
 * synchronously inside its own click listener, so reading location.pathname
 * on the next tick sees the already-updated URL).
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    const onClick = () => setTimeout(update, 0);

    window.addEventListener('popstate', update);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', update);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return pathname;
}
