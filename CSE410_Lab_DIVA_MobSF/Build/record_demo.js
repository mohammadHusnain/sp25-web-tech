// Records a real screen-capture style demo: terminal build steps, then live MobSF UI driven with a visible cursor.
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://127.0.0.1:8000';
const APK = process.argv[2];
const OUTDIR = process.argv[3];
const TERM = process.argv[4];

const CURSOR = `
(() => {
  const add = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.innerHTML = '<svg width="22" height="30" viewBox="0 0 22 30"><path d="M1 1 L1 23 L7 18 L11 28 L15 26 L11 16 L19 16 Z" fill="#fff" stroke="#000" stroke-width="1.6"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(' + (window.__cx||640) + 'px,' + (window.__cy||360) + 'px)';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    document.addEventListener('mousedown', () => { c.firstChild.style.transform = 'scale(0.85)'; }, true);
    document.addEventListener('mouseup', () => { c.firstChild.style.transform = ''; }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();`;

const termHtml = (title) => `<html><body style="margin:0;background:#300a24;font-family:'DejaVu Sans Mono',monospace">
<div style="background:#2c2c2c;color:#ddd;height:34px;display:flex;align-items:center;padding:0 12px;font:14px sans-serif">
<span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
<span style="flex:1;text-align:center">${title}</span></div>
<pre id="t" style="margin:0;padding:12px 16px;color:#eee;font-size:14px;line-height:1.4;white-space:pre-wrap;height:660px;overflow:hidden"></pre></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: OUTDIR, size: { width: 1280, height: 720 } } });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  const sleep = (ms) => page.waitForTimeout(ms);
  let cx = 640, cy = 360;
  const moveTo = async (x, y, steps = 18) => { await page.mouse.move(x, y, { steps }); cx = x; cy = y; await page.evaluate(([a, b]) => { window.__cx = a; window.__cy = b; }, [x, y]); };
  const moveEl = async (loc, steps = 18) => {
    try { await loc.scrollIntoViewIfNeeded({ timeout: 5000 }); } catch (e) { console.error('FAIL', loc.toString()); throw e; }
    const b = await loc.boundingBox();
    await moveTo(b.x + Math.min(b.width / 2, 60), b.y + b.height / 2, steps);
  };
  const clickEl = async (loc) => { await moveEl(loc); await sleep(150); await page.mouse.down(); await sleep(80); await page.mouse.up(); };
  const wheel = async (dy, n = 6) => { for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy / n); await sleep(60); } };

  // ---------- Terminal scene (real commands/outputs from the lab run) ----------
  await page.setContent(termHtml('student@lab: ~/CSE410'));
  await page.evaluate(CURSOR);
  const P = '<span style="color:#8ae234;font-weight:bold">student@lab</span>:<span style="color:#729fcf;font-weight:bold">~/CSE410</span>$ ';
  const out = (s) => page.evaluate((s) => { const t = document.getElementById('t'); t.innerHTML += s; t.scrollTop = t.scrollHeight; }, s);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const type = async (cmd) => { await out(P); for (const ch of cmd) { await out(esc(ch)); await sleep(18); } await sleep(200); await out('\n'); };
  const lines = async (arr, d = 45) => { for (const l of arr) { await out(esc(l) + '\n'); await sleep(d); } };
  const txt = (f) => fs.readFileSync(`${TERM}/${f}.txt`, 'utf8').split('\n').filter((l) => !l.startsWith('$ '));

  await moveTo(900, 500, 5);
  await type('git clone https://github.com/payatu/diva-android.git');
  await lines(["Cloning into 'diva-android'...", 'Receiving objects: 100% (275/275), done.']);
  await type('cd diva-android/app/src/main/jni && make');
  await lines(txt('t2_make').filter((l) => l.startsWith('[') || l.startsWith('cp')).slice(0, 12), 35);
  await type('cd ~/CSE410 && ./build_diva_apk.sh diva-android deps out');
  await lines(txt('t3_build').filter((l) => l.startsWith('==') || l.startsWith('BUILD')), 110);
  await type('docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest');
  await lines(txt('t6_docker_run').filter((l) => !l.startsWith('CONTAINER') && !l.startsWith('55c0') && !/^\d{3}$/.test(l)).slice(0, 12), 40);
  await sleep(600);

  // ---------- MobSF login ----------
  await page.goto(`${BASE}/login/`);
  await sleep(500);
  await clickEl(page.locator('input[name="username"]'));
  await page.keyboard.type('mobsf', { delay: 70 });
  await clickEl(page.locator('input[name="password"]'));
  await page.keyboard.type('mobsf', { delay: 70 });
  await clickEl(page.locator('button:has-text("Sign In")'));
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // ---------- Upload APK ----------
  const fc = page.waitForEvent('filechooser');
  await clickEl(page.locator('.drop-title'));
  await (await fc).setFiles(APK);
  await page.waitForURL(/static_analyzer/, { timeout: 120000 });
  await page.waitForLoadState('networkidle');
  await sleep(700);

  // ---------- Report: hover key areas ----------
  await moveEl(page.locator('text=Security Score').first());
  await sleep(500);
  await moveEl(page.locator('text=Package Name').first());
  await sleep(400);
  await moveEl(page.locator('text=EXPORTED PROVIDERS').first());
  await sleep(500);

  // Open AndroidManifest.xml in the same tab
  await page.evaluate(() => document.querySelectorAll('a[target]').forEach((a) => a.removeAttribute('target')));
  await clickEl(page.locator('a:has-text("View AndroidManifest.xml")'));
  await page.waitForLoadState('networkidle');
  await sleep(400);
  await moveEl(page.locator('text=.NotesProvider').first());
  await sleep(1200);
  await page.goBack({ waitUntil: 'networkidle' });

  // Manifest analysis section via sidebar scroll
  await page.evaluate(() => { const e = document.querySelector('#manifest'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 60 }); });
  await sleep(300);
  await moveEl(page.locator('#table_manifest td:has-text("NotesProvider")').first());
  await sleep(1000);
  await wheel(700);
  await sleep(300);

  // Code analysis: open SQLInjectionActivity.java
  await page.evaluate(() => document.querySelectorAll('a[target]').forEach((a) => a.removeAttribute('target')));
  await moveEl(page.locator('#table_code td:has-text("SQL")').first());
  await sleep(600);
  const sq = page.locator('a[href*="SQLInjectionActivity"]:visible').first();
  if (await sq.count()) await clickEl(sq);
  else {
    await clickEl(page.locator('#table_code button:has-text("Show Files"), #table_code a:has-text("Show Files")').first()).catch(() => {});
    await sleep(500);
    const href = await page.locator('a[href*="SQLInjectionActivity"]').first().getAttribute('href');
    const v = page.locator('a[href*="SQLInjectionActivity"]:visible').first();
    if (await v.count()) await clickEl(v); else await page.goto(new URL(href, page.url()).href);
  }
  await page.waitForLoadState('networkidle');
  await sleep(400);
  await moveEl(page.locator('text=rawQuery').first(), 25);
  await sleep(1500);
  await page.goBack({ waitUntil: 'networkidle' });

  // Scorecard
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.querySelectorAll('a[target]').forEach((a) => a.removeAttribute('target')));
  await clickEl(page.locator('a:has-text("MobSF Scorecard")'));
  await page.waitForLoadState('networkidle');
  await sleep(500);
  await moveEl(page.locator('text=Grade').first());
  await sleep(600);
  await wheel(450);
  await moveTo(400, 420);
  await sleep(1200);

  await ctx.close();
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
