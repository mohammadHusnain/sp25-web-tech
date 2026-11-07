// Records an animated terminal (commands typed, real output shown) as a video. Usage: node term_anim.js scenes.json outdir
const { chromium } = require('playwright'); const fs = require('fs');
const scenes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const out = process.argv[3];
const PROMPT = /^(\w{3} \w{3} \d{2} \d{2}:\d{2} [AP]M \[\d+\]) ([\w-]+):(\S*)([#$]) (.*)$/;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
  const p = await ctx.newPage();
  await p.setContent(`<body style="margin:0;background:#300a24;font-family:'DejaVu Sans Mono',monospace;color:#eee;overflow:hidden">
<div id="ban" style="background:#2d2d2d;color:#fff;font:600 20px 'DejaVu Sans',sans-serif;padding:12px 22px;height:26px;display:none"></div>
<pre id="t" style="margin:0;padding:14px 22px;font-size:15px;line-height:19px;white-space:pre-wrap;word-break:break-all;height:690px;overflow:hidden"></pre>
<style>.y{color:#fce94f}.u{color:#8ae234;font-weight:bold}.p{color:#729fcf;font-weight:bold}.c{color:#fff;font-weight:bold}.r{color:#ff6b6b}</style></body>`);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  for (const sc of scenes) {
    await p.evaluate((t) => { document.getElementById('ban').textContent = t; document.getElementById('t').innerHTML = ''; }, sc.banner);
    const lines = sc.text.split('\n');
    const chars = lines.reduce((n, l) => n + ((l.match(PROMPT) || [])[5] || '').length, 0) || 1;
    const delay = Math.max(2, Math.min(14, Math.floor((sc.typeMs || 800) / chars)));
    for (const l of lines) {
      const m = l.match(PROMPT);
      if (m) {
        await p.evaluate(([h]) => { document.getElementById('t').insertAdjacentHTML('beforeend', h); }, [`<span class="y">${esc(m[1])}</span> <span class="u">${esc(m[2])}</span>:<span class="p">${esc(m[3])}</span>${esc(m[4])} <span class="c" id="cur"></span>`]);
        for (let i = 0; i < m[5].length; i += 3) { await p.evaluate(([c]) => { document.getElementById('cur').textContent += c; }, [m[5].slice(i, i + 3)]); await p.waitForTimeout(delay * 3); }
        await p.evaluate(() => { const c = document.getElementById('cur'); c.removeAttribute('id'); c.parentElement.insertAdjacentText('beforeend', '\n'); });
        await p.waitForTimeout(120);
      } else {
        const red = /(denied|cannot|not permitted|No such)/i.test(l);
        await p.evaluate(([h]) => { const t = document.getElementById('t'); t.insertAdjacentHTML('beforeend', h + '\n'); t.scrollTop = t.scrollHeight; }, [red ? `<span class="r">${esc(l)}</span>` : esc(l)]);
      }
    }
    await p.waitForTimeout(sc.holdMs || 500);
  }
  await ctx.close(); await b.close();
})();
