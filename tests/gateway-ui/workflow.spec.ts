import { test, expect, type BrowserContext } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { createServerClient } from '@supabase/ssr';
import type { Draft, Scan } from '../../lib/gateway/schemas';

test.describe.configure({ mode: 'serial' });
let fixture: Server;
let app: ChildProcess;
let origin: string;
let appOrigin: string;
let directory: string;
let cookieValues: { name: string; value: string }[] = [];
let originalNextEnv = '';
let savedDraft: Draft;
let savedScan: Scan;
const ownerId = '00000000-0000-4000-8000-000000000001';
const user = {
  id: ownerId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'fixture@gateway.test',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};
async function signIn(context: BrowserContext) {
  await context.addCookies(cookieValues.map((cookie) => ({ ...cookie, url: appOrigin })));
}
test.beforeAll(async () => {
  originalNextEnv = await readFile('next-env.d.ts', 'utf8');
  directory = await mkdtemp(join(tmpdir(), 'gateway-bridge-'));
  fixture = createServer((request, response) => {
    if (request.url?.startsWith('/auth/v1/user')) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(user));
      return;
    }
    if (request.url?.startsWith('/rest/v1/profiles')) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: ownerId, full_name: 'Fixture Merchant' }));
      return;
    }
    response.setHeader('Content-Type', 'text/html');
    if (request.url?.startsWith('/products/pack'))
      response.end(
        '<html><title>Trail Pack</title><body><h1>Trail Pack</h1><p>Blue hiking backpack for $89 USD.</p><script type="application/ld+json">{"@type":"Product","name":"Trail Pack","offers":{"price":"89","priceCurrency":"USD"}}</script></body></html>',
      );
    else
      response.end(
        '<html><title>Bridge Test Store</title><body><h1>Hiking essentials</h1><a href="/products/pack">Trail Pack</a></body></html>',
      );
  });
  await new Promise<void>((resolve) => fixture.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(fixture.address() as { port: number }).port}`;
  const portServer = createServer();
  await new Promise<void>((resolve) => portServer.listen(0, '127.0.0.1', resolve));
  const port = (portServer.address() as { port: number }).port;
  await new Promise<void>((resolve) => portServer.close(() => resolve()));
  appOrigin = `http://127.0.0.1:${port}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'development',
    NEXT_PUBLIC_SUPABASE_URL: origin,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key',
    NEXT_PUBLIC_SITE_URL: appOrigin,
    GATEWAY_MODEL_MODE: 'fixture',
    GATEWAY_DATA_DIR: directory,
    GATEWAY_NEXT_DIST_DIR: '.next-gateway-tests',
    GATEWAY_TEST_ENVIRONMENTS: JSON.stringify([
      {
        id: 'bridge-fixture',
        origin,
        entryPath: '/?utm_source=bridge',
        allowedPathPrefixes: ['/', '/products', '/search'],
        searchPath: '/search',
        searchQueryParam: 'q',
        allowLoopback: true,
      },
    ]),
  };
  const chromium = join(homedir(), '.cache/ms-playwright/chromium-1234/chrome-linux64/chrome');
  if (existsSync(chromium)) Object.assign(env, { GATEWAY_CHROMIUM_PATH: chromium });
  app = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    { cwd: process.cwd(), env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let startup = '';
  app.stdout?.on('data', (chunk) => {
    startup = (startup + chunk).slice(-8000);
  });
  app.stderr?.on('data', (chunk) => {
    startup = (startup + chunk).slice(-8000);
  });
  await expect
    .poll(
      async () => {
        if (app.exitCode !== null) throw new Error(`Test app stopped: ${startup}`);
        try {
          return (await fetch(`${appOrigin}/discover`)).status;
        } catch {
          return 0;
        }
      },
      { timeout: 90_000, intervals: [500, 1000] },
    )
    .toBe(200);
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        sub: ownerId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'authenticated',
      }),
    ).toString('base64url'),
    Buffer.from('fixture-signature').toString('base64url'),
  ].join('.');
  const auth = createServerClient(origin, 'fixture-public-key', {
    cookies: {
      getAll: () => [],
      setAll: (values) => {
        cookieValues = values.map(({ name, value }) => ({ name, value }));
      },
    },
  });
  const { error } = await auth.auth.setSession({
    access_token: token,
    refresh_token: 'fixture-refresh',
  });
  if (error) throw error;
});
test.afterAll(async () => {
  if (app?.pid) {
    try {
      process.kill(-app.pid, 'SIGTERM');
    } catch {}
  }
  if (fixture?.listening) await new Promise<void>((resolve) => fixture.close(() => resolve()));
  if (directory) await rm(directory, { recursive: true, force: true });
  if (originalNextEnv)
    await writeFile(
      'next-env.d.ts',
      originalNextEnv.replace(
        './.next-gateway-tests/types/routes.d.ts',
        './.next/types/routes.d.ts',
      ),
    );
});
test.beforeEach(async ({ context }) => {
  await signIn(context);
});

test('authenticated merchant inspects, edits, approves, and runs the actual Gateway workflow', async ({
  page,
}) => {
  await page.goto(`${appOrigin}/discover`);
  await expect(page.getByLabel('Storefront URL')).toHaveValue(`${origin}/?utm_source=bridge`);
  await page.getByRole('button', { name: 'Inspect storefront', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review customer archetypes' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('button', { name: 'Run approved scan' })).toBeDisabled();
  await page.getByLabel('Archetype 1 name').fill('Patient comparison shopper');
  await page
    .getByLabel('Scenario 1 goal', { exact: true })
    .fill('Inspect the Trail Pack and recommend it from observed evidence.');
  await page
    .getByLabel('I reviewed these archetypes, goals, constraints, and permitted actions.')
    .check();
  await page.getByRole('button', { name: 'Approve test plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run approved scan' })).toBeEnabled();
  const draftId = new URL(page.url()).searchParams.get('draft');
  savedDraft = (await (await page.request.get(`${appOrigin}/api/gateway/drafts/${draftId}`)).json())
    .data;
  expect(savedDraft.archetypes[0].provenance.source).toBe('merchant_edit');
  await page.getByRole('button', { name: 'Run approved scan' }).click();
  await expect(page.getByText('3 / 3 sessions finished', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  const scans = await (await page.request.get(`${appOrigin}/api/gateway/scans`)).json();
  savedScan = (
    await (
      await page.request.get(`${appOrigin}/api/gateway/scans/${scans.data.items[0].id}`)
    ).json()
  ).data;
  expect(savedScan.sessions.map((session) => session.evaluation?.outcome)).toEqual([
    'passed',
    'passed',
    'passed',
  ]);
  expect(savedScan.fixture).toBe(true);
  await page.screenshot({ path: 'test-results/gateway-ui/approved-run.png', fullPage: true });
});

test('dashboard, sessions, replay and findings load persisted results across page reloads', async ({
  page,
}) => {
  await page.goto(`${appOrigin}/dashboard`);
  await expect(page.getByRole('heading', { name: 'Storefront testing overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View scan', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'View scan', exact: true }).click();
  await expect(page.getByText('3 / 3 sessions finished', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View sessions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shopping sessions' })).toBeVisible();
  await page.getByLabel('Filter by test mode').selectOption('constraint');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: /Inspect \d+ events/ }).click();
  await expect(page.getByRole('heading', { name: 'Session replay' })).toBeVisible();
  await page.getByRole('tab', { name: 'Evaluation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Independent outcome evaluation' })).toBeVisible();
  await expect(
    page.getByText('Fixture semantic verdict; not an independent AI assessment.'),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Model usage' }).click();
  await expect(page.getByRole('cell', { name: 'evaluator', exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export session JSON' }).click();
  expect((await downloadPromise).suggestedFilename()).toContain('gateway-session-');
  await page.goto(`${appOrigin}/recommendations`);
  await expect(page.getByRole('heading', { name: 'No findings recorded' })).toBeVisible();
  await page.goto(`${appOrigin}/replays/00000000-0000-4000-8000-000000000099`);
  await expect(page.locator('.gateway-error')).toContainText('Session not found');
});

test('saved plans survive reload, edits revoke approval, and stale revisions are recoverable', async ({
  page,
}) => {
  await page.goto(`${appOrigin}/discover?draft=${savedDraft.id}`);
  await expect(page.getByLabel('Archetype 1 name')).toHaveValue('Patient comparison shopper');
  await page.getByLabel('Archetype 1 name').fill('Edited again');
  await expect(page.getByRole('button', { name: 'Run approved scan' })).toBeDisabled();
  const response = await page.request.patch(`${appOrigin}/api/gateway/drafts/${savedDraft.id}`, {
    data: {
      revision: savedDraft.revision,
      archetypes: savedDraft.archetypes,
      scenarios: savedDraft.scenarios,
      approved: false,
    },
  });
  expect(response.ok()).toBe(true);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.gateway-error')).toContainText('Reload the latest draft');
  await page.getByRole('button', { name: 'Reload latest revision' }).click();
  await expect(page.getByLabel('Archetype 1 name')).toHaveValue('Patient comparison shopper');
  await expect(page.getByRole('button', { name: 'Run approved scan' })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Storefront URL').fill(`${origin}/search`);
  await expect(page.getByRole('button', { name: 'Run approved scan' })).toHaveCount(0);
});

test('configuration errors stay visible and never produce a scripted success', async ({ page }) => {
  await page.route('**/api/gateway/drafts', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            apiVersion: 'v1',
            error: {
              code: 'CONFIGURATION_ERROR',
              message: 'OPENAI_API_KEY is required.',
              retryable: false,
            },
          }),
        })
      : route.continue(),
  );
  await page.goto(`${appOrigin}/discover`);
  await page.getByRole('button', { name: 'Inspect storefront', exact: true }).click();
  await expect(page.locator('.gateway-error')).toContainText('OPENAI_API_KEY is required.');
  await expect(page.getByRole('button', { name: 'Approve test plan' })).toHaveCount(0);
  const retired = await page.request.post(`${appOrigin}/api/agent-scan`, { data: {} });
  expect(retired.status()).toBe(410);
});

test('API authorization remains enforced independently of the public discovery page', async ({
  browser,
}) => {
  const context = await browser.newContext();
  try {
    const response = await context.request.get(`${appOrigin}/api/gateway/dashboard`);
    expect(response.status()).toBe(401);
    const page = await context.newPage();
    await page.goto(`${appOrigin}/discover`);
    await expect(page.getByRole('alert').filter({ hasText: 'Sign in to inspect' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Inspect storefront', exact: true }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});
