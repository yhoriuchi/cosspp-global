import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function openFilters(page: Page) {
  const button = page.getByRole('button', { name: 'Refine filters' });
  if ((await button.isVisible()) && (await button.getAttribute('aria-expanded')) === 'false')
    await button.click();
}
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
  await expect(page.getByRole('heading', { name: 'Sources & updates' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yusaku Horiuchi');
  await page.getByRole('link', { name: 'Back to faculty directory' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('Horiuchi');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await openFilters(page);
  await page.getByRole('checkbox', { name: 'Japan', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Political Science', exact: true }).check();
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
  await page.reload();
  await openFilters(page);
  await expect(page.getByRole('checkbox', { name: 'Japan', exact: true })).toBeChecked();
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
  await openFilters(page);
  await expect(page.getByRole('checkbox', { name: 'Japan', exact: true })).toBeChecked();
  await expect(page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true })).toBeVisible();
});
test('geographic navigation, empty language state and unknown profile', async ({ page }) => {
  await page.goto('?page=explore');
  await expect(page.locator('.world-map')).toBeVisible();
  await page.locator('.place-grid').getByRole('link', { name: /Japan/ }).click();
  await openFilters(page);
  await expect(page.getByRole('checkbox', { name: 'Japan', exact: true })).toBeChecked();
  await page.locator('summary').filter({ hasText: 'Languages' }).click();
  await expect(
    page.getByText('Language options will appear here as faculty choose to share them.'),
  ).toBeVisible();
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
  await openFilters(page);
  await expect(page.getByRole('checkbox', { name: 'Japan', exact: true })).toBeChecked();
  await page.getByRole('link', { name: 'Yusaku Horiuchi', exact: true }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});
