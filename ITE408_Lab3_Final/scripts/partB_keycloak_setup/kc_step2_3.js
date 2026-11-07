// Lab 3 Part B, Steps 2-3: admin login, then enforce OTP on the admin user and complete the OTP setup.
const { chromium } = require('playwright');
const { BASE, totp, shot } = require('./kc_lib');
const FIRST = 'Anas', SID = '1091080';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // Step 2
  await page.goto(`${BASE}/`);
  await page.waitForSelector('#username', { timeout: 60000 });
  await shot(page, 'fig27_admin_login_page');
  await page.fill('#username', FIRST);
  await page.fill('#password', SID);
  await page.click('#kc-login');
  await page.waitForURL(/admin\/master\/console/, { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=Manage realms', { timeout: 30000 }).catch(() => {});
  await shot(page, 'fig28_admin_console_after_login');

  // Step 3.1 - Users -> admin user -> Configure OTP
  await page.goto(`${BASE}/admin/master/console/#/master/users`);
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 30000 });
  await page.fill('input[placeholder*="Search"]', FIRST);
  await page.keyboard.press('Enter');
  await page.waitForSelector(`a:has-text("${FIRST}")`, { timeout: 30000 });
  await page.click(`a:has-text("${FIRST}")`);
  await page.waitForSelector('text=Required user actions', { timeout: 30000 });
  await page.waitForTimeout(800);
  // open the required-actions select and choose Configure OTP
  const field = page.locator('[id="requiredActions"], [data-testid="requiredActions"]').first();
  await field.click();
  await page.click('text=Configure OTP');
  await page.keyboard.press('Escape');
  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=The user has been saved', { timeout: 15000 }).catch(() => {});
  await shot(page, 'fig29_user_details_configure_otp');

  // Step 3.2 - sign out and sign in again
  await page.click('button[data-testid="options-toggle"], #user-dropdown, button:has-text("' + FIRST + '")');
  await page.click('text=Sign out');
  await page.waitForSelector('#username', { timeout: 30000 });
  await page.fill('#username', FIRST);
  await page.fill('#password', SID);
  await page.click('#kc-login');
  await page.waitForSelector('#totp', { timeout: 30000 });
  await page.waitForSelector('#kc-totp-secret-qr-code', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${require('./kc_lib').OUT}/fig30_otp_setup_qr_page.png`, fullPage: true });
  console.log('shot fig30 (QR code view, full page)');
  await page.click('#mode-manual');
  await page.waitForTimeout(500);
  const secretText = (await page.textContent('#kc-totp-secret-key')).trim();
  console.log('secret key shown by Keycloak:', secretText);

  // Step 3.3 - enter the one-time code (computed from the shown secret, as an authenticator app would)
  await page.fill('#totp', totp(secretText));
  await page.fill('#userLabel', 'Anas authenticator').catch(() => {});
  await page.screenshot({ path: `${require('./kc_lib').OUT}/fig30b_otp_code_entered.png`, fullPage: true });
  await page.click('#saveTOTPBtn');
  await page.waitForURL(/admin\/master\/console/, { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await shot(page, 'fig31_login_after_otp');
  require('fs').writeFileSync('/tmp/claude-0/lab3work/admin_otp_secret.txt', secretText);

  await browser.close();
})().catch((e) => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
