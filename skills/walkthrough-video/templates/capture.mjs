#!/usr/bin/env node
// Clean web screenshots with Playwright: fixed viewport, device scale 2, network idle, fonts loaded,
// scrollbars/carets hidden, reduced motion. Reads the `capture:` block of scenes.yaml.
// Usage: node capture.mjs [scenes.yaml] [--only name]
//        node capture.mjs --login <url>   # headed browser; the USER signs in, then press Enter here.
//                                         # Session saved to .auth.json (gitignored), never commit it.
// Needs: npm install (playwright is an optional dependency) and `npx playwright install chromium`.
import { mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { loadConfig } from './lib.mjs';

const { chromium } = await import('playwright').catch(() => {
  console.error('playwright is not installed: npm install playwright && npx playwright install chromium');
  process.exit(1);
});
const args = process.argv.slice(2);

if (args[0] === '--login') {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(args[1]);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question('Sign in in the browser window, then press Enter here to save the session... ');
  rl.close();
  await context.storageState({ path: '.auth.json' });
  await browser.close();
  console.log('saved .auth.json');
  process.exit(0);
}

const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args.splice(onlyIdx, 2)[1] : null;
const cfg = loadConfig(args[0]);
const cap = { viewport: [1440, 900], scale: 2, dir: 'shots', ...cfg.capture };
if (!cap.shots?.length) throw new Error('scenes.yaml has no capture.shots');
const outDir = resolve(cfg.root, cap.dir);
mkdirSync(outDir, { recursive: true });

const clean = `
  ::-webkit-scrollbar { display: none !important; }
  * { scrollbar-width: none !important; caret-color: transparent !important; }
  *, *::before, *::after { transition: none !important; animation-duration: 0s !important; animation-delay: 0s !important; }
`;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: cap.viewport[0], height: cap.viewport[1] },
  deviceScaleFactor: cap.scale,
  colorScheme: cap.colorScheme ?? 'light',
  reducedMotion: 'reduce',
  locale: cap.locale ?? 'en-US',
  timezoneId: cap.timezone ?? 'UTC',
  storageState: existsSync(resolve(cfg.root, '.auth.json')) ? resolve(cfg.root, '.auth.json') : undefined,
});
for (const shot of cap.shots) {
  if (only && shot.name !== only) continue;
  const page = await context.newPage();
  await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.addStyleTag({ content: clean + (shot.hide ?? cap.hide ?? []).map((s) => `${s} { visibility: hidden !important; }`).join('\n') });
  if (shot.waitFor) await page.waitForSelector(shot.waitFor, { state: 'visible', timeout: 30_000 });
  for (const step of shot.steps ?? []) {
    if (step.click) await page.click(step.click);
    if (step.hover) await page.hover(step.hover);
    if (step.fill) await page.fill(step.fill[0], step.fill[1]);
    if (step.press) await page.keyboard.press(step.press);
    if (step.scroll) await page.mouse.wheel(0, step.scroll);
    await page.waitForLoadState('networkidle');
  }
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(shot.settle ?? 400);
  const file = join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: !!shot.fullPage });
  console.log(file);
  await page.close();
}
await browser.close();
