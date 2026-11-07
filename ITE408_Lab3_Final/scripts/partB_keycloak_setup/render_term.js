// Renders terminal output text as a terminal-window PNG (same style as the original Part A screenshots).
// Usage: node render_term.js jobs.json   where jobs = [{title, text, out}]
const { chromium } = require('playwright');
const fs = require('fs');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PROMPT = /^(\w{3} \w{3} \d{2} \d{2}:\d{2} [AP]M \[\d+\]) ([\w-]+):(\S*)([#$]) (.*)$/;
const RED = /(Permission denied|cannot|No such file|not permitted|Operation not|denied)/i;

function line(l) {
  const m = l.match(PROMPT);
  if (m) {
    return `<span class="y">${esc(m[1])}</span> <span class="u">${esc(m[2])}</span>:<span class="p">${esc(m[3])}</span>${esc(m[4])} <span class="c">${esc(m[5])}</span>`;
  }
  return RED.test(l) ? `<span class="r">${esc(l)}</span>` : esc(l);
}

(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 980, height: 200 }, deviceScaleFactor: 2 });
  for (const j of jobs) {
    const body = j.text.split('\n').map(line).join('\n');
    await page.setContent(`<html><body style="margin:0;background:transparent">
<div id="w" style="width:980px;border-radius:9px;overflow:hidden;background:#300a24;font-family:'DejaVu Sans Mono',monospace">
<div style="background:#2d2d2d;height:31px;position:relative;color:#ddd;font:14px 'DejaVu Sans',sans-serif;text-align:center;line-height:31px">
<span style="position:absolute;left:12px;top:0;letter-spacing:6px"><span style="color:#ff5f56">&#9679;</span><span style="color:#ffbd2e">&#9679;</span><span style="color:#27c93f">&#9679;</span></span>${esc(j.title)}</div>
<pre style="margin:0;padding:12px 14px 14px;color:#eeeeec;font-size:13px;line-height:19px;white-space:pre-wrap;word-break:break-all">${body}</pre></div>
<style>.y{color:#fce94f}.u{color:#8ae234;font-weight:bold}.p{color:#729fcf;font-weight:bold}.c{color:#fff;font-weight:bold}.r{color:#ff6b6b}</style></body></html>`);
    const el = await page.$('#w');
    await el.screenshot({ path: j.out, omitBackground: true });
  }
  await browser.close();
})();
