// Shared helpers for driving the real Keycloak admin console with Chromium and taking screenshots.
const crypto = require('crypto');
const BASE = 'http://localhost:8080';
const OUT = '/tmp/claude-0/lab3work/shotsB';
require('fs').mkdirSync(OUT, { recursive: true });

function b32decode(s) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  s = s.replace(/[\s=]/g, '').toUpperCase();
  let bits = '';
  for (const c of s) bits += A.indexOf(c).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function totp(secret, digits = 6, step = 30) {
  const counter = Math.floor(Date.now() / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', b32decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h.readUInt32BE(o) & 0x7fffffff) % 10 ** digits).toString().padStart(digits, '0');
  return code;
}
const shot = async (page, name) => {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
};
module.exports = { BASE, OUT, totp, shot };
