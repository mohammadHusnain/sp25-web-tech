// Drives the MobSF web UI: login, dashboard, upload APK, wait for static analysis, capture evidence.
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://127.0.0.1:8000';
const APK = process.argv[2];
const SHOTS = process.argv[3];
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const shot = async (name, opts = {}) => {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/${name}.png`, ...opts });
    console.log('shot', name);
  };

  await page.goto(`${BASE}/login/`);
  await shot('s2_01_mobsf_login');
  await page.fill('input[name="username"]', 'mobsf');
  await page.fill('input[name="password"]', 'mobsf');
  page.on('dialog', (d) => d.accept());
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.press('input[name="password"]', 'Enter')]);
  await page.waitForLoadState('networkidle');
  await shot('s2_02_mobsf_dashboard');

  // Upload through the home-page file input
  await page.setInputFiles('#uploadFile', APK);
  await page.waitForTimeout(1500);
  await shot('s3_01_upload_in_progress');
  await page.waitForURL(/static_analyzer|android/, { timeout: 15 * 60 * 1000 });
  await page.waitForLoadState('networkidle', { timeout: 5 * 60 * 1000 });
  console.log('report url', page.url());
  fs.writeFileSync(`${SHOTS}/report_url.txt`, page.url());
  await shot('s3_02_report_top');
  await shot('s3_03_report_full', { fullPage: true });

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
