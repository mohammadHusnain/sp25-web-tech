// Lab 3 Part B, Steps 4-6 and 8: realm MyApp080, user, public client, confidential client (real admin console).
const { chromium } = require('playwright');
const fs = require('fs');
const { BASE, OUT, totp, shot } = require('./kc_lib');
const FIRST = 'Anas', SID = '1091080', XYZ = '080', REALM = `MyApp${XYZ}`;
const FAMILY = 'syed'; // username requested by the student (Keycloak stores usernames in lower case)
const OTPSECRET = fs.readFileSync('/tmp/claude-0/lab3work/admin_otp_secret.txt', 'utf8').trim();

const full = async (page, name) => { await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); console.log('shot', name); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5, ...(process.env.REC ? { recordVideo: { dir: process.env.REC, size: { width: 1280, height: 900 } } } : {}) });
  const page = await ctx.newPage();
  global.__page = page;

  // login as admin (password + OTP)
  await page.goto(`${BASE}/`);
  await page.fill('#username', FIRST);
  await page.fill('#password', SID);
  await page.click('#kc-login');
  await page.waitForSelector('#otp', { timeout: 30000 });
  await page.fill('#otp', totp(OTPSECRET));
  await page.click('#kc-login');
  await page.waitForURL(/admin\/master\/console/, { timeout: 60000 });
  await page.waitForLoadState('networkidle');

  if (process.env.RESUME) {
    await page.click('text=Manage realms'); await page.waitForSelector(`text=${REALM}`); await page.click(`a:has-text("${REALM}")`); await page.waitForTimeout(2000);
  }
  if (!process.env.SKIP_REALM && !process.env.RESUME) {
  // ---------- Step 4: create realm ----------
  await page.click('text=Manage realms');
  await page.waitForSelector('text=Create realm', { timeout: 30000 });
  await shot(page, 'fig32b_manage_realms');
  await page.click('text=Create realm');
  await page.waitForSelector('input[id="kc-realm-name"], input[name="realm"]', { timeout: 30000 });
  await page.locator('input[id="kc-realm-name"], input[name="realm"]').first().fill(REALM);
  await shot(page, 'fig32a_create_realm_form');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.waitForSelector(`text=${REALM}`, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot(page, 'fig32_realm_created');

  }
  if (!process.env.RESUME) {
  // ---------- Step 5: create user ----------
  await page.locator('nav a:has-text("Users"), nav >> text=Users').first().click();
  await page.locator('main').getByText(/^(Add user|Create new user)$/).first().click();
  await page.waitForSelector('#username', { timeout: 30000 });
  console.log('realm shown:', (await page.locator('.pf-v5-c-badge, [class*="realm"]').first().textContent().catch(() => '')) );
  await page.fill('#username', FAMILY);
  await shot(page, 'fig33a_add_user_form');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.waitForTimeout(2500);
  const err = await page.locator('.pf-v5-c-helper-text__item.pf-m-error, .pf-m-error, [role="alert"]').allTextContents().catch(() => []);
  console.log('after create user, errors/alerts:', JSON.stringify(err).slice(0, 300), '| url', page.url());
  await shot(page, 'fig33b_user_after_create');
  // credentials
  await page.click('[data-testid="credentials"], a[role="tab"]:has-text("Credentials"), button[role="tab"]:has-text("Credentials")');
  await page.click('button:has-text("Set password")');
  await page.waitForSelector('#passwordField, input[data-testid="passwordField"]', { timeout: 15000 }).catch(() => {});
  const pw = page.locator('#passwordField, [data-testid="passwordField"]').first();
  await pw.fill(SID);
  await page.locator('#passwordConfirmationField, [data-testid="passwordConfirmationField"]').first().fill(SID);
  // Temporary toggle is ON by default -> turn it off
  const temp = page.locator('#temporaryPasswordSwitch, [data-testid="temporaryPasswordSwitch"], label:has-text("Temporary")').first();
  await temp.click();
  await shot(page, 'fig33c_set_password_temp_off');
  await page.locator('[data-testid="confirm"], button:has-text("Save")').last().click();
  await page.locator('button:has-text("Save password")').click();
  await page.waitForTimeout(2000);
  await shot(page, 'fig33_user_created_credentials');

  }
  // ---------- Step 6: public client ----------
  const mkclient = async (clientId, confidential) => {
    await page.locator('nav a:has-text("Clients")').first().click();
    await page.locator('main').getByText('Create client', { exact: true }).first().click();
    await page.waitForSelector('#clientId', { timeout: 30000 });
    await page.fill('#clientId', clientId);
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Client authentication', { timeout: 15000 });
    if (confidential) {
      await page.locator('[data-testid="authentication"], label:has(input[data-testid="authentication"]), .pf-v5-c-switch, .pf-v6-c-switch').first().click();
      await page.waitForTimeout(600);
    }
    await page.getByRole('checkbox', { name: /Direct access grants/ }).check();
    if (confidential) await page.getByRole('checkbox', { name: /Service account roles/ }).check();
    await page.waitForTimeout(600);
    await shot(page, confidential ? 'fig38a_capability_config' : 'fig35a_capability_config');
    await page.click('button:has-text("Next")');
    if (!confidential) {
      await page.waitForSelector('text=Valid redirect URIs', { timeout: 15000 });
      const inputs = page.getByRole('textbox');
      await inputs.nth(2).fill('https://www.keycloak.org/app/*');
      await inputs.nth(4).fill('https://www.keycloak.org');
      await shot(page, 'fig35b_login_settings');
    }
    await page.click('button:has-text("Save")');
    await page.waitForSelector('text=Client created successfully', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
  };
  await mkclient(`my-client${XYZ}`, false);
  await full(page, 'fig35_public_client_settings');

  // ---------- Step 8: confidential client ----------
  await mkclient(`my-Confidential-Client${XYZ}`, true);
  await full(page, 'fig38_confidential_client_settings');
  await page.click('button[role="tab"]:has-text("Credentials"), a[role="tab"]:has-text("Credentials"), [data-testid="credentials"]');
  await page.waitForSelector('text=Client Secret', { timeout: 15000 });
  await page.waitForTimeout(1000);
  // reveal the secret (eye button next to the secret field)
  await page.locator('button[aria-label*="Show"], button[aria-label*="show"]').first().click().catch(() => {});
  await page.waitForTimeout(500);
  const secret = await page.locator('input[aria-label="Client secret"], input[data-testid="secret"], input[type="text"][value]').first().inputValue().catch(() => '');
  console.log('client secret length', secret.length);
  fs.writeFileSync('/tmp/claude-0/lab3work/client_secret.txt', secret);
  await shot(page, 'fig39_credentials_client_secret');

  await browser.close();
})().catch(async (e) => { try { await global.__page.screenshot({ path: OUT + '/_err.png' }); console.error('url', global.__page.url()); } catch (x) {} console.error('ERR', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
