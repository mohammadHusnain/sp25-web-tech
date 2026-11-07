// Renders (a) a DevTools-style "Network" view of the real captured token request (Step 7) and
// (b) the decoded JWT header/payload (Step 9). Data comes from real runs: step7_token_request.json, jwt_parts.json.
const { chromium } = require('playwright');
const fs = require('fs');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const D = '/tmp/claude-0/lab3work';
const tr = JSON.parse(fs.readFileSync(`${D}/step7_token_request.json`, 'utf8'));
const jwt = JSON.parse(fs.readFileSync(`${D}/jwt_parts.json`, 'utf8'));
const resp = JSON.stringify(JSON.parse(tr.body), null, 2);
const post = Object.fromEntries(new URLSearchParams(tr.post));
const when = (n) => new Date(n * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

const net = `<html><body style="margin:0;background:#202124;color:#e8eaed;font:12px 'DejaVu Sans',Arial,sans-serif;width:1280px">
<div style="background:#292a2d;padding:6px 12px;border-bottom:1px solid #3c4043;font-size:13px"><span style="color:#8ab4f8;border-bottom:2px solid #8ab4f8;padding:6px 10px">Network</span> &nbsp; <span style="color:#9aa0a6">Elements &nbsp; Console &nbsp; Sources &nbsp; Application</span></div>
<div style="padding:6px 12px;border-bottom:1px solid #3c4043"><span style="background:#3c4043;padding:3px 8px;border-radius:3px">Filter: <b>token</b></span> &nbsp; <span style="color:#9aa0a6">Fetch/XHR &nbsp; All</span></div>
<div style="display:flex;min-height:520px"><div style="width:360px;border-right:1px solid #3c4043">
 <div style="padding:6px 10px;color:#9aa0a6;border-bottom:1px solid #3c4043">Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status &nbsp;&nbsp;Type</div>
 <div style="padding:7px 10px;background:#394457">token &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#81c995">${tr.status}</span> &nbsp;&nbsp;&nbsp;&nbsp;fetch</div></div>
<div style="flex:1;padding:0"><div style="padding:7px 12px;border-bottom:1px solid #3c4043;color:#9aa0a6">Headers &nbsp;&nbsp; Payload &nbsp;&nbsp; Preview &nbsp;&nbsp; <span style="color:#8ab4f8;border-bottom:2px solid #8ab4f8;padding-bottom:6px">Response</span> &nbsp;&nbsp; Timing</div>
<div style="padding:6px 12px;color:#9aa0a6">POST ${esc(tr.url)} &nbsp;(Request payload: grant_type=${esc(post.grant_type)}, client_id=${esc(post.client_id)}, code_verifier=…)</div>
<pre style="margin:0;padding:6px 12px;font:12px 'DejaVu Sans Mono',monospace;white-space:pre-wrap;word-break:break-all;color:#e8eaed">${esc(resp)}</pre></div></div>
<div style="padding:5px 12px;color:#9aa0a6;font-size:11px;border-top:1px solid #3c4043">Network view drawn from the browser's captured /token request and response (the DevTools window itself cannot be screenshotted in the automated browser).</div>
</body></html>`;

const pay = Object.entries(jwt.payload).map(([k, v]) => [k, v]);
const dec = `<html><body style="margin:0;background:#fff;color:#111;font:14px 'DejaVu Sans',Arial,sans-serif;width:1100px">
<div style="background:#1a237e;color:#fff;padding:12px 20px;font-size:17px">Decoded JWT – access token for <b>my-Confidential-Client080</b> (MyApp080)</div>
<div style="display:flex;gap:18px;padding:18px 20px">
<div style="flex:1"><div style="color:#c62828;font-weight:bold;margin-bottom:6px">HEADER: ALGORITHM &amp; TOKEN TYPE</div>
<pre style="margin:0;background:#f5f5f5;padding:12px;font:13px 'DejaVu Sans Mono',monospace;border-left:4px solid #c62828">${esc(JSON.stringify(jwt.header, null, 2))}</pre>
<div style="color:#00838f;font-weight:bold;margin:16px 0 6px">SIGNATURE (Base64URL, first 60 characters)</div>
<pre style="margin:0;background:#f5f5f5;padding:12px;font:13px 'DejaVu Sans Mono',monospace;border-left:4px solid #00838f;white-space:pre-wrap;word-break:break-all">${esc(jwt.sig.slice(0, 60))}…</pre>
<div style="margin-top:16px;color:#333;line-height:1.5"><b>exp</b> = ${when(jwt.payload.exp)}<br><b>iat</b> = ${when(jwt.payload.iat)}<br>Lifetime = ${jwt.payload.exp - jwt.payload.iat} seconds (5 minutes)</div></div>
<div style="flex:1.3"><div style="color:#6a1b9a;font-weight:bold;margin-bottom:6px">PAYLOAD: DATA (claims)</div>
<pre style="margin:0;background:#f5f5f5;padding:12px;font:12px 'DejaVu Sans Mono',monospace;border-left:4px solid #6a1b9a;white-space:pre-wrap;word-break:break-all">${esc(JSON.stringify(jwt.payload, null, 2))}</pre></div></div>
<div style="padding:6px 20px 12px;color:#666;font-size:11px">Decoded locally from the real token returned by Keycloak (jwt.io could not be reached from this machine).</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 600 }, deviceScaleFactor: 1.5 });
  await p.setContent(net); await p.screenshot({ path: `${D}/shotsB/fig37_devtools_token_response.png`, fullPage: true });
  await p.setViewportSize({ width: 1100, height: 600 });
  await p.setContent(dec); await p.screenshot({ path: `${D}/shotsB/fig41_decoded_jwt.png`, fullPage: true });
  await b.close();
})();
