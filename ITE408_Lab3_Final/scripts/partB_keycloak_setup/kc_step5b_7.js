// Step 5 (test login to account page) and Step 7 (public client login + token response).
// keycloak.org is not reachable from this sandbox, so the browser is given a small local copy of the demo app
// at the same address (https://www.keycloak.org/app/) via request interception. Everything else is real:
// the Keycloak login page, the authorization-code + PKCE flow and the /token request/response.
const { chromium } = require('playwright');
const fs = require('fs');
const { BASE, OUT } = require('./kc_lib');
const USER = 'syed', PASS = '1091080', REALM = 'MyApp080', CLIENT = 'my-client080';
const shotp = async (page, name, opts = {}) => { await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/${name}.png`, ...opts }); console.log('shot', name); };

const DEMO = `<!doctype html><html><head><meta charset="utf-8"><title>Keycloak demo app (local copy)</title>
<style>body{font-family:'Red Hat Text',Arial,sans-serif;margin:0;background:#f0f0f0;color:#151515}
header{background:#151515;color:#fff;padding:14px 28px;font-size:20px;letter-spacing:.5px}
main{max-width:640px;margin:36px auto;background:#fff;padding:28px 34px;border-radius:4px;box-shadow:0 1px 4px #0003}
label{display:block;margin:14px 0 4px;font-weight:600}input{width:100%;padding:8px;font-size:15px;border:1px solid #8a8d90;box-sizing:border-box}
button{margin:18px 10px 0 0;padding:9px 22px;font-size:15px;background:#06c;color:#fff;border:0;border-radius:3px;cursor:pointer}
pre{background:#f5f5f5;padding:12px;font-size:12px;white-space:pre-wrap;word-break:break-all;max-height:260px;overflow:auto}
small{color:#555}</style></head><body><header>Keycloak demo app &nbsp;<small style="color:#aaa">(local copy of the demo page)</small></header>
<main id="m"></main>
<script>
const KC='http://localhost:8080', REDIR='https://www.keycloak.org/app/';
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
const m=document.getElementById('m');
async function login(){
  const realm=document.getElementById('realm').value, client=document.getElementById('client').value;
  sessionStorage.setItem('cfg',JSON.stringify({realm,client}));
  const ver=b64u(crypto.getRandomValues(new Uint8Array(32))); sessionStorage.setItem('ver',ver);
  const ch=b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ver)));
  location.href=KC+'/realms/'+realm+'/protocol/openid-connect/auth?client_id='+client+'&redirect_uri='+encodeURIComponent(REDIR)+'&response_type=code&scope=openid&code_challenge='+ch+'&code_challenge_method=S256&state='+Math.random().toString(36).slice(2);
}
async function main(){
  const q=new URLSearchParams(location.search), cfg=JSON.parse(sessionStorage.getItem('cfg')||'{}');
  if(q.get('code')){
    const r=await fetch(KC+'/realms/'+cfg.realm+'/protocol/openid-connect/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'authorization_code',client_id:cfg.client,code:q.get('code'),redirect_uri:REDIR,code_verifier:sessionStorage.getItem('ver')})});
    const t=await r.json(); const p=JSON.parse(atob(t.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    m.innerHTML='<h2>Hello, '+(p.name||p.preferred_username)+'</h2><p>You are signed in. Realm <b>'+cfg.realm+'</b>, client <b>'+cfg.client+'</b>.</p><pre>'+JSON.stringify({preferred_username:p.preferred_username,email:p.email,iss:p.iss,azp:p.azp,exp:p.exp},null,2)+'</pre>';
    window.__done=true; return;
  }
  m.innerHTML='<h2>Keycloak demo app</h2><label>Keycloak URL</label><input value="'+KC+'" disabled><label>Realm</label><input id="realm" value="${REALM}"><label>Client</label><input id="client" value="${CLIENT}"><button id="signin">Sign in</button>';
  document.getElementById('signin').onclick=login;
}
main();
</script></body></html>`;

(async () => {
  const https = require('https');
  const srv = https.createServer({ key: fs.readFileSync('/tmp/claude-0/lab3work/demo.key'), cert: fs.readFileSync('/tmp/claude-0/lab3work/demo.crt') }, (q, r) => { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(DEMO); }).listen(443, '127.0.0.1');
  const browser = await chromium.launch({ args: ['--no-proxy-server', '--host-resolver-rules=MAP www.keycloak.org 127.0.0.1'] });

  // ---------- Step 5: test the new user on the realm's account page ----------
  if (!process.env.STEP7_ONLY) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, ...(process.env.REC ? { recordVideo: { dir: process.env.REC, size: { width: 1280, height: 800 } } } : {}) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/realms/${REALM}/account`);
    await page.waitForSelector('#username');
    await page.fill('#username', USER); await page.fill('#password', PASS);
    await shotp(page, 'fig34a_account_login_form');
    await page.click('#kc-login');
    await page.waitForTimeout(2000);
    if (await page.locator('#email').count()) {          // Keycloak asks the new user to complete the profile
      await shotp(page, 'fig34b_update_account_information');
      await page.fill('#email', 'anas.syed@example.com');
      await page.fill('#firstName', 'Anas');
      await page.fill('#lastName', 'Syed');
      await page.click('input[type="submit"], button[type="submit"]');
    }
    await page.waitForURL(/account/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    await shotp(page, 'fig34_account_page_logged_in');
    await ctx.close();
  }

  // ---------- Step 7: public client through the demo app ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, ignoreHTTPSErrors: true, ...(process.env.REC ? { recordVideo: { dir: process.env.REC, size: { width: 1280, height: 800 } } } : {}) });
    const page = await ctx.newPage();
    let tokenReq = null;
    page.on('response', async (res) => {
      if (res.url().endsWith('/protocol/openid-connect/token') && res.request().method() === 'POST') {
        tokenReq = { url: res.url(), status: res.status(), reqHeaders: res.request().headers(), post: res.request().postData(), body: await res.text(), type: res.headers()['content-type'] };
      }
    });
    await page.goto('https://www.keycloak.org/app/');
    await shotp(page, 'fig36a_demo_app_config');
    await page.click('#signin');
    await page.waitForSelector('#username', { timeout: 30000 });
    await shotp(page, 'fig36b_login_page_for_realm');
    await page.fill('#username', USER); await page.fill('#password', PASS);
    await page.click('#kc-login');
    await page.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
    await shotp(page, 'fig36_demo_app_signed_in');
    fs.writeFileSync('/tmp/claude-0/lab3work/step7_token_request.json', JSON.stringify(tokenReq, null, 2));
    console.log('token request captured:', tokenReq && tokenReq.status, (tokenReq && tokenReq.body || '').length);
    await ctx.close();
  }
  srv.close(); await browser.close();
})().catch((e) => { console.error('ERR', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
