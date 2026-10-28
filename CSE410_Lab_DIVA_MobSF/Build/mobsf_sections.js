// Captures individual MobSF report sections, the scorecard and the source view of key findings.
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8000';
const HASH = '299b15c63aac6aae44ce42281e768b4c';
const OUT = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login/`);
  await page.fill('input[name="username"]', 'mobsf');
  await page.fill('input[name="password"]', 'mobsf');
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.press('input[name="password"]', 'Enter')]);

  await page.goto(`${BASE}/static_analyzer/${HASH}/`, { waitUntil: 'networkidle' });
  // Show all DataTables rows so findings are not paginated away
  await page.evaluate(() => {
    if (window.jQuery && jQuery.fn.dataTable) {
      jQuery('table.dataTable').each(function () { try { jQuery(this).DataTable().page.len(-1).draw(); } catch (e) {} });
    }
  });

  const sections = [
    ['s3_04_information', '#information'],
    ['s3_05_certificate_analysis', '#certificate_analysis'],
    ['s3_06_permissions', '#permissions'],
    ['s3_07_manifest_analysis', '#manifest'],
    ['s3_08_code_analysis', '#code_analysis'],
    ['s3_09_binary_analysis', '#binary_analysis'],
    ['s3_10_android_api', '#android_api'],
    ['s3_11_secrets', '#secrets'],
    ['s3_12_providers_activities', '#activities'],
  ];
  for (const [name, sel] of sections) {
    const ok = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const y = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo(0, y);
      return true;
    }, sel);
    if (!ok) { console.log('missing', sel); continue; }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log('shot', name);
  }

  await page.goto(`${BASE}/appsec_dashboard/${HASH}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/s3_13_appsec_scorecard.png`, fullPage: true });
  console.log('shot scorecard');

  const views = [
    ['s4_01_src_SQLInjectionActivity', 'jakhar/aseem/diva/SQLInjectionActivity.java'],
    ['s4_02_src_NotesProvider', 'jakhar/aseem/diva/NotesProvider.java'],
    ['s4_03_src_InsecureDataStorage4Activity', 'jakhar/aseem/diva/InsecureDataStorage4Activity.java'],
    ['s4_04_src_LogActivity', 'jakhar/aseem/diva/LogActivity.java'],
    ['s4_05_src_HardcodeActivity', 'jakhar/aseem/diva/HardcodeActivity.java'],
  ];
  for (const [name, file] of views) {
    await page.goto(`${BASE}/view_file/?file=${encodeURIComponent(file)}&md5=${HASH}&type=apk`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log('shot', name);
  }
  await page.goto(`${BASE}/manifest_view/${HASH}/?type=apk`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/s4_06_manifest_xml.png`, fullPage: true });
  console.log('shot manifest');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
