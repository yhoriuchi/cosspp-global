import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// External image availability is checked separately; keep UI checks deterministic.
const portraitPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/[^/]*fsu\.edu\/.*\.(?:jpe?g|png|webp|avif)(?:\?.*)?$/i, (route) =>
    route.fulfill({ contentType: 'image/png', body: portraitPixel }),
  );
});
test('country expertise appears in regional searches with matching exploration counts', async ({
  page,
}) => {
  await page.goto('?page=explore');
  const eastAsia = page.locator('.place-grid').getByRole('link', { name: /^East Asia / });
  const count = Number((await eastAsia.innerText()).match(/\d+/)![0]);
  await eastAsia.click();
  await expect(page.getByRole('status')).toContainText(`${count} faculty`);
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  const horiuchiCard = page.locator('.faculty-card').filter({
    has: page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true }),
  });
  for (const region of ['East Asia', 'Asia', 'Global / Cross-national']) {
    await expect(
      horiuchiCard.locator('.tag.region').filter({ hasText: new RegExp(`^${region}$`) }),
    ).toHaveCount(1);
    await expect(horiuchiCard.getByText(region, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toHaveValue(
    'East Asia',
  );
  await page.reload();
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.goto('?page=directory&region=Asia&q=Horiuchi');
  await expect(page.getByRole('status')).toContainText('1 faculty');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true }).click();
  for (const region of ['East Asia', 'Asia', 'Global / Cross-national']) {
    await expect(
      page.locator('.tag.region').filter({ hasText: new RegExp(`^${region}$`) }),
    ).toHaveCount(1);
    await expect(page.getByRole('link', { name: region, exact: true })).toBeVisible();
  }
  await page.getByRole('link', { name: 'East Asia', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`${count} faculty`);
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
});
test('home, search, filters, profile, refresh and history under repository subpath', async ({
  page,
}) => {
  await page.goto('');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Global perspectives');
  await page.getByRole('searchbox').fill('Horiuchi');
  await page.getByRole('button', { name: 'Find faculty' }).click();
  await expect(page.getByRole('status')).toContainText('1 faculty');
  await page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yusaku Horiuchi');
  await expect(page.getByRole('heading', { name: 'Last updated' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yusaku Horiuchi');
  await page.getByRole('link', { name: 'Back to faculty directory' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('Horiuchi');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption('JP');
  await page
    .getByRole('combobox', { name: 'Department', exact: true })
    .selectOption('Political Science');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue('JP');
  await page.getByRole('searchbox').fill('zzzz-no-person');
  await expect(page.getByRole('heading', { name: 'No results for this search' })).toBeVisible();
});
test('homepage illustration and interactive research map have distinct behavior', async ({
  page,
}) => {
  await page.goto('');
  await expect(page.locator('.world-map')).toBeVisible();
  await expect(page.locator('.world-map [data-country="AQ"]')).toHaveCount(0);
  const center = await page.locator('.world-map').evaluate((element) => {
    const svg = element as SVGSVGElement;
    const dot = svg.querySelector('.map-origin-dot') as SVGCircleElement;
    return {
      x: dot.cx.baseVal.value / svg.viewBox.baseVal.width,
      y: dot.cy.baseVal.value / svg.viewBox.baseVal.height,
    };
  });
  expect(center.x).toBeCloseTo(0.5, 8);
  expect(center.y).toBeCloseTo(0.5, 8);
  await expect(page.getByRole('img', { name: /World map centered on Tallahassee/ })).toBeVisible();
  await expect(page.locator('.world-map a')).toHaveCount(0);
  await expect(page.locator('.world-map .mapped, .world-map .unmapped')).toHaveCount(0);
  expect(await page.locator('.world-map .illustration-land').count()).toBeGreaterThan(150);
  const fills = await page
    .locator('.world-map .illustration-land')
    .evaluateAll((paths) => [...new Set(paths.map((path) => getComputedStyle(path).fill))]);
  expect(fills).toHaveLength(1);
  await expect(
    page.getByText('Research connections in this directory', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Explore research geography' }).click();
  await expect(page.locator('.world-map-research')).toBeVisible();
  await expect(page.locator('.world-map .map-origin, .world-map [data-country="AQ"]')).toHaveCount(
    0,
  );
  expect(await page.locator('.world-map').textContent()).not.toContain('Tallahassee');
  const japan = page.locator('.world-map').getByRole('link', { name: /^Japan:/ });
  await japan.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue('JP');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
});
test('geographic navigation, sourced language filter and unknown profile', async ({ page }) => {
  await page.goto('?page=explore');
  await expect(page.locator('.world-map')).toBeVisible();
  await page.locator('.place-grid').getByRole('link', { name: /Japan/ }).click();
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue('JP');
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ja');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.goto('?page=profile&id=does-not-exist');
  await expect(page.getByRole('heading', { name: 'Profile not found' })).toBeVisible();
});
test('responsive pages, internal routes, keyboard and automated accessibility', async ({
  page,
  browserName,
}) => {
  // Five pages plus axe scans can exceed 30 seconds on shared CI runners.
  test.setTimeout(60_000);
  for (const route of ['home', 'directory', 'explore', 'departments', 'about']) {
    await page.goto(`?page=${route}`);
    if (route === 'explore') await expect(page.locator('.world-map')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(
        results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ),
    ).toEqual([]);
  }
  await page.goto('');
  // macOS WebKit uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.getByRole('button', { name: 'Use dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect((await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test('every profile has a working internal route and no private data is served', async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  const rows: { id: string; full_name: string }[] = JSON.parse(
    readFileSync('data/public/faculty.json', 'utf8'),
  );
  for (const r of rows) {
    await page.goto(`?page=profile&id=${r.id}`);
    await expect(page.locator('h1')).toHaveText(r.full_name);
  }
  for (const path of [
    'data/review/coverage.json',
    'project_history/Yusaku_Horiuchi/2026-10-27%20by%20Codex.md',
  ]) {
    const response = await request.get(path);
    expect(response.headers()['content-type']).not.toContain('application/json');
    expect(await response.text()).not.toContain('Model display name:');
  }
});

test('map failure preserves geographic search and profile accessibility', async ({ page }) => {
  await page.route('**/world.geojson', (route) => route.abort());
  await page.goto('');
  await expect(page.getByText('The map could not load.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Browse research countries and regions.' }).click();
  await expect(page.getByText('The map could not load.', { exact: false })).toBeVisible();
  await page.locator('.place-grid').getByRole('link', { name: /Japan/ }).click();
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue('JP');
  await page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});

test('profile highlights detailed sources, self-reported languages and US research', async ({
  page,
}) => {
  await page.goto('?page=directory&language=ja&q=Horiuchi');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true }).click();
  const resources = page.getByRole('navigation', { name: 'Detailed faculty information' });
  await expect(resources.getByRole('link', { name: /Personal academic website/ })).toHaveAttribute(
    'href',
    'https://horiuchi.org',
  );
  await expect(resources.getByRole('link', { name: /Curriculum vitae/ })).toBeVisible();
  expect(
    await resources.evaluate(
      (el) =>
        !!(
          el.compareDocumentPosition(document.querySelector('.profile-layout')!) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ),
  ).toBe(true);
  await expect(page.getByRole('heading', { name: 'Japanese', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'public CV ↗', exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Shared with faculty permission/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.goto('?page=directory&country=US&q=Atkeson');
  await expect(page.getByRole('link', { name: 'Lonna Atkeson', exact: true })).toBeVisible();
});

test('four compact dropdowns combine with topic and method text search', async ({ page }) => {
  await page.goto('?page=directory');
  const filters = page.getByRole('region', { name: 'Faculty filters' });
  await expect(filters.getByRole('combobox')).toHaveCount(4);
  await expect(
    page.getByText('Search names, research topics, methods, places, and languages.'),
  ).toBeVisible();
  const positions = await filters.getByRole('combobox').evaluateAll((selects) =>
    selects.map((el) => ({
      x: el.getBoundingClientRect().x,
      y: el.getBoundingClientRect().y,
      height: el.getBoundingClientRect().height,
    })),
  );
  const searchBottom = await page
    .getByRole('searchbox')
    .evaluate((el) => el.getBoundingClientRect().bottom);
  expect(positions.every((p) => p.height >= 44)).toBe(true);
  expect(positions[0].y).toBeGreaterThan(searchBottom);
  expect(positions[0].y).toBe(positions[1].y);
  expect(positions[1].x).toBeGreaterThan(positions[0].x);
  if (page.viewportSize()!.width > 540) {
    expect(new Set(positions.map((p) => p.y)).size).toBe(1);
  } else {
    expect(positions[2].y).toBeGreaterThan(positions[0].y);
    expect(positions[2].y).toBe(positions[3].y);
  }
  await page
    .getByRole('combobox', { name: 'Department', exact: true })
    .selectOption('Political Science');
  await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption('JP');
  await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toHaveValue(
    'East Asia',
  );
  await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ja');
  await page.getByRole('searchbox').fill('Conjoint analysis');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toHaveValue('ja');
  await page.getByRole('searchbox').fill('Public diplomacy');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Department', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  for (const label of ['Department', 'Country', 'Region', 'Language'])
    await expect(page.getByRole('combobox', { name: label, exact: true })).toHaveValue('');
  await page.goto('?page=directory&country=JP&country=US');
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue(
    '__multiple__',
  );
  await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption('JP');
  expect(new URL(page.url()).searchParams.getAll('country')).toEqual(['JP']);
});

test('official portrait opens the profile and appears beside its name', async ({ page }) => {
  await page.goto('?page=directory&q=Horiuchi');
  const portrait = page.getByRole('img', { name: 'Portrait of Yusaku Horiuchi' });
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute('referrerpolicy', 'no-referrer');
  await page.getByRole('link', { name: 'Open profile of Yusaku Horiuchi', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yusaku Horiuchi');
  await expect(page.locator('.profile-heading').getByRole('img')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Photo: official FSU page' })).toHaveAttribute(
    'href',
    'https://cosspp.fsu.edu/polisci/faculty/2080/',
  );
  await page.reload();
  await expect(page.locator('.profile-heading').getByRole('img')).toBeVisible();
});
test('unavailable portraits fall back to initials without blocking profile navigation', async ({
  page,
}) => {
  await page.route(/^https:\/\/[^/]*fsu\.edu\/.*\.(?:jpe?g|png|webp|avif)(?:\?.*)?$/i, (route) =>
    route.abort(),
  );
  await page.goto('?page=directory&q=Horiuchi');
  await expect(page.locator('.avatar')).toHaveText('YH');
  await expect(page.locator('.avatar img')).toHaveCount(0);
  await page.getByRole('link', { name: 'Open profile of Yusaku Horiuchi', exact: true }).click();
  await expect(page.locator('.profile-heading .avatar')).toHaveText('YH');
});
test('profiles without verified photos retain initials', async ({ page }) => {
  await page.goto('?page=profile&id=stewart-fotheringham');
  await expect(page.locator('.profile-heading .avatar')).toHaveText('SF');
  await expect(page.locator('.profile-heading img')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Photo: official FSU page' })).toHaveCount(0);
});

test('region restricts countries and country sets and locks its region', async ({ page }) => {
  await page.goto('?page=directory');
  const country = page.getByRole('combobox', { name: 'Country', exact: true });
  const region = page.getByRole('combobox', { name: 'Region', exact: true });
  await region.selectOption('East Asia');
  await expect(country.locator('option[value="JP"]')).toHaveCount(1);
  await expect(country.locator('option[value="US"]')).toHaveCount(0);
  await expect(country.locator('option[value="FR"]')).toHaveCount(0);
  await country.selectOption('JP');
  await expect(region).toHaveValue('East Asia');
  await expect(region).toBeDisabled();
  await page.reload();
  await expect(region).toHaveValue('East Asia');
  await expect(region).toBeDisabled();
  await country.selectOption('');
  await expect(region).toBeEnabled();
  await region.selectOption('Europe');
  await expect(country.locator('option[value="JP"]')).toHaveCount(0);
  await expect(country.locator('option[value="FR"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await country.selectOption('US');
  await expect(region).toHaveValue('North America');
  await expect(region).toBeDisabled();
  await page.goto('?page=directory&country=JP&region=Europe');
  await expect(country).toHaveValue('JP');
  await expect(region).toHaveValue('East Asia');
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.goto('?page=directory&country=JP&region=Asia');
  await expect(region).toHaveValue('Asia');
  await expect(region).toBeDisabled();
  await page.getByRole('button', { name: 'Remove region filter Asia', exact: true }).click();
  await expect(country).toHaveValue('');
  await expect(region).toHaveValue('');
  await expect(region).toBeEnabled();
  await page.goto('?page=profile&id=yusaku-horiuchi');
  await expect(page.getByRole('heading', { name: 'Last updated', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources & updates' })).toHaveCount(0);
});
