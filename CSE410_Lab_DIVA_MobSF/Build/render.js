// Renders captured terminal output text files as terminal-style PNG screenshots.
const { chromium } = require('playwright');
const fs = require('fs');
const [dir, ...items] = process.argv.slice(2);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 400 }, deviceScaleFactor: 1.5 });
  for (const it of items) {
    const [file, title] = it.split('::');
    const body = esc(fs.readFileSync(`${dir}/${file}.txt`, 'utf8'))
      .replace(/^(\$ .*)$/gm, '<span class="c">$1</span>')
      .replace(/(BUILD SUCCESSFUL.*|Status: Downloaded.*|ERROR.*)/g, '<span class="ok">$1</span>');
    await p.setContent(`<html><body style="margin:0;background:#2b2b2b;font-family:'DejaVu Sans Mono',monospace">
      <div style="background:#3c3f41;color:#ddd;padding:8px 14px;font:13px sans-serif">● ● ●&nbsp;&nbsp; ${esc(title)} — root@lab-host (Ubuntu 24.04)</div>
      <pre style="margin:0;padding:14px;color:#d4d4d4;font-size:12.5px;line-height:1.45;white-space:pre-wrap">${body}</pre>
      <style>.c{color:#6ad36a;font-weight:bold}.ok{color:#ffd76a;font-weight:bold}</style></body></html>`);
    await p.screenshot({ path: `${dir}/${file}.png`, fullPage: true });
    console.log('rendered', file);
  }
  await b.close();
})();
