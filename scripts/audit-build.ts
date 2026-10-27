import { readFileSync, readdirSync, statSync } from 'node:fs';
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) =>
    statSync(`${dir}/${n}`).isDirectory() ? walk(`${dir}/${n}`) : [`${dir}/${n}`],
  );
const paths = walk('dist');
for (const path of paths) {
  if (/review|history|\.map$|\.csv$/.test(path)) throw new Error(`Unexpected build file ${path}`);
  const s = readFileSync(path, 'utf8');
  if (/internal_notes|faculty_disclosed_citizenship|\/Users\/yh25m|data\/review/.test(s))
    throw new Error(`Private field/path in ${path}`);
}
const html = readFileSync('dist/index.html', 'utf8');
const base = process.env.BASE_PATH || '/';
for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (m[1].startsWith('http')) continue;
  if (!m[1].startsWith(base)) throw new Error(`Wrong base ${m[1]}`);
  const relative = m[1].slice(base.length);
  if (!paths.includes(`dist/${relative}`)) throw new Error(`Missing build asset ${relative}`);
}
console.log(`Build audit passed: ${paths.length} files, base ${base}, no private fields or paths.`);
