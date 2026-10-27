import { useEffect, useState } from 'react';
export function navigate(href: string, replace = false) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export function useLocation() {
  const [search, setSearch] = useState(window.location.search);
  useEffect(() => {
    const update = () => setSearch(window.location.search);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return new URLSearchParams(search);
}
