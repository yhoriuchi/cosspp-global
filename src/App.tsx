import { useEffect, useRef } from 'react';
import raw from '../data/public/faculty.json';
import { datasetSchema } from './types/faculty';
import { useLocation } from './utils/navigation';
import { Header, Footer, PageHeading } from './components/Layout';
import { Link } from './components/Link';
import { Home } from './pages/Home';
import { Directory } from './pages/Directory';
import { Profile } from './pages/Profile';
import { Explore } from './pages/Explore';
import { Departments } from './pages/Departments';
import { About } from './pages/About';
const rows = datasetSchema.parse(raw);
export default function App() {
  const params = useLocation();
  const page = params.get('page') || 'home';
  const id = params.get('id');
  const previousRoute = useRef(`${page}:${id}`);
  useEffect(() => {
    document.title = `${page === 'profile' ? rows.find((r) => r.id === id)?.full_name || 'Profile' : ({ home: 'Faculty Expertise & Connections', directory: 'Faculty directory', explore: 'Explore geography', departments: 'Departments', about: 'About' } as Record<string, string>)[page] || 'Page not found'} · COSSPP Global`;
    if (previousRoute.current !== `${page}:${id}`) {
      document.querySelector<HTMLHeadingElement>('h1')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      previousRoute.current = `${page}:${id}`;
    }
  }, [page, id]);
  const content =
    page === 'home' ? (
      <Home rows={rows} />
    ) : page === 'directory' ? (
      <Directory rows={rows} params={params} />
    ) : page === 'profile' ? (
      <Profile person={rows.find((r) => r.id === id)} params={params} />
    ) : page === 'explore' ? (
      <Explore rows={rows} />
    ) : page === 'departments' ? (
      <Departments rows={rows} />
    ) : page === 'about' ? (
      <About rows={rows} />
    ) : (
      <>
        <PageHeading eyebrow="COSSPP GLOBAL" title="Page not found" />
        <Link href="?page=directory">Browse faculty</Link>
      </>
    );
  return (
    <>
      <Header page={page} />
      <main id="main" className="shell" tabIndex={-1}>
        {content}
      </main>
      <Footer
        updated={
          rows
            .map((r) => r.last_updated)
            .sort()
            .at(-1) || ''
        }
      />
    </>
  );
}
