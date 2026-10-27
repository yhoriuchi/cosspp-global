import { useState, type ReactNode } from 'react';
import { Link } from './Link';
export function Header({ page }: { page: string }) {
  const [dark, setDark] = useState(() => {
    try {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && matchMedia('(prefers-color-scheme: dark)').matches)
      );
    } catch {
      return false;
    }
  });
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="institution">
        <div className="shell">
          FLORIDA STATE UNIVERSITY <span>COLLEGE OF SOCIAL SCIENCES & PUBLIC POLICY</span>
        </div>
      </div>
      <header className="shell header">
        <Link className="brand" href="?page=home" aria-label="COSSPP Global home">
          <span className="brand-symbol" aria-hidden="true">
            ◎
          </span>
          <span>
            <strong>
              COSSPP <em>Global</em>
            </strong>
            <small>Faculty Expertise & Connections</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {[
            ['directory', 'Faculty directory'],
            ['explore', 'Explore geography'],
            ['departments', 'Departments'],
            ['about', 'About'],
          ].map(([p, label]) => (
            <Link key={p} href={`?page=${p}`} aria-current={page === p ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <button
          className="theme-toggle"
          aria-label={dark ? 'Use light mode' : 'Use dark mode'}
          onClick={() => {
            setDark(!dark);
            try {
              localStorage.setItem('theme', dark ? 'light' : 'dark');
            } catch {
              /* Theme remains usable without storage. */
            }
          }}
        >
          {dark ? '☀' : '☾'}
        </button>
      </header>
    </>
  );
}
export function Footer({ updated }: { updated: string }) {
  return (
    <footer>
      <div className="shell footer-grid">
        <div>
          <strong>COSSPP Global</strong>
          <p>
            Connecting faculty across countries,
            <br />
            cultures, and disciplines.
          </p>
        </div>
        <div>
          <p>
            An independently developed faculty directory project.
            <br />
            Not an officially endorsed Florida State University service.
          </p>
          <Link href="?page=about">Sources, scope & updates ↗</Link>
        </div>
        <div>
          <small>LAST UPDATED</small>
          <p>{updated || 'Data collection in progress'}</p>
          <small>Public sources. Thoughtful connections.</small>
        </div>
      </div>
    </footer>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1 tabIndex={-1}>{title}</h1>
      {children && <div className="lede">{children}</div>}
    </div>
  );
}
