// Samples the top edge of every phone screen in public/screens (400 px files) and writes src/data/screen-tops.json:
// the colour the mock status bar uses so it continues the app's own background. Run after adding screens:
//   node scripts/screen-tops.mjs
import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('../public/screens/', import.meta.url));
const out = {};
for (const name of readdirSync(dir).filter((n) => /-400\.webp$/.test(n)).sort()) {
  const { data, info } = await sharp(dir + name).extract({ left: 0, top: 0, width: 400, height: 4 }).raw().toBuffer({ resolveWithObject: true });
  // The most common colour across the top rows (ignores a stray pixel of content).
  const counts = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const key = [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const hex = '#' + [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0].toUpperCase();
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  out[name.replace(/-400\.webp$/, '')] = { bg: hex, dark: 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 };
}
writeFileSync(new URL('../src/data/screen-tops.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(Object.entries(out).map(([k, v]) => `${k} ${v.bg}${v.dark ? ' dark' : ''}`).join('\n'));
