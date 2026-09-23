#!/usr/bin/env node
// Checks every blog illustration for text layout problems by rendering it in
// Chromium: overlapping labels, labels outside the canvas, visible strokes
// (lines, circle/rect outlines) running through text, and labels straddling a
// shape edge. Strokes hidden under a later opaque shape are ignored.
//
//   npm run check:illustrations
//   CHROMIUM_PATH=/path/to/chrome npm run check:illustrations
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../images/blog');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
let total = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()) {
  await page.setContent(fs.readFileSync(path.join(dir, file), 'utf8'));
  const issues = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
      const texts = [...svg.querySelectorAll('text')].map(t => ({ s: t.textContent, b: t.getBBox() }));
      const out = [];
      const inter = (a, c, pad = 0) => a.x + pad < c.x + c.width && c.x + pad < a.x + a.width && a.y + pad < c.y + c.height && c.y + pad < a.y + a.height;
      // text vs text
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++)
        if (inter(texts[i].b, texts[j].b, 1)) out.push(`TEXT/TEXT "${texts[i].s}" x "${texts[j].s}"`);
      // out of bounds
      for (const t of texts) if (t.b.x < 2 || t.b.y < 2 || t.b.x + t.b.width > W - 2 || t.b.y + t.b.height > H - 2) out.push(`OUT OF BOUNDS "${t.s}"`);
      // strokes (paths/lines) passing through text
      const all = [...svg.querySelectorAll('*')];
      const order = el => all.indexOf(el);
      const pts = [];
      for (const el of svg.querySelectorAll('path, line')) {
        if (el.getAttribute('stroke') === 'none') continue;
        const len = el.getTotalLength(), o = order(el);
        for (let d = 0; d <= len; d += 1.5) { const q = el.getPointAtLength(d); pts.push({ x: q.x, y: q.y, o }); }
      }
      // outlines of stroked circles, ellipses and rects (skip the background rect)
      const bg = svg.querySelector('rect');
      for (const el of svg.querySelectorAll('circle, ellipse, rect')) {
        if (el === bg || !el.getAttribute('stroke') || el.getAttribute('stroke') === 'none') continue;
        const bb = el.getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, o = order(el);
        if (el.tagName === 'rect') {
          for (let x = bb.x; x <= bb.x + bb.width; x += 1.5) { pts.push({ x, y: bb.y, o }); pts.push({ x, y: bb.y + bb.height, o }); }
          for (let y = bb.y; y <= bb.y + bb.height; y += 1.5) { pts.push({ x: bb.x, y, o }); pts.push({ x: bb.x + bb.width, y, o }); }
        } else {
          for (let a = 0; a < Math.PI * 2; a += 0.004) pts.push({ x: cx + bb.width / 2 * Math.cos(a), y: cy + bb.height / 2 * Math.sin(a), o });
        }
      }
      const covers = [...svg.querySelectorAll('rect, circle, ellipse')].filter(el => {
        const fill = el.getAttribute('fill'); const fo = el.getAttribute('fill-opacity');
        return el !== bg && fill && fill !== 'none' && (!fo || Number(fo) >= 1);
      }).map(el => ({ b: el.getBBox(), o: order(el) }));
      const visible = pts.filter(q => !covers.some(c => c.o > q.o && q.x > c.b.x + 1 && q.x < c.b.x + c.b.width - 1 && q.y > c.b.y + 1 && q.y < c.b.y + c.b.height - 1));
      for (const t of texts) {
        const b = t.b, sh = { x: b.x + 1, y: b.y + 2, width: b.width - 2, height: b.height - 4 };
        if (visible.some(q => q.x > sh.x && q.x < sh.x + sh.width && q.y > sh.y && q.y < sh.y + sh.height)) out.push(`LINE THROUGH "${t.s}"`);
      }
      // text straddling a shape edge (partially inside a rect/circle)
      for (const el of svg.querySelectorAll('rect, circle')) {
        if (el === svg.querySelector('rect')) continue; // background
        const sb = el.getBBox();
        for (const t of texts) {
          const b = t.b;
          const contained = b.x >= sb.x - 1 && b.y >= sb.y - 1 && b.x + b.width <= sb.x + sb.width + 1 && b.y + b.height <= sb.y + sb.height + 1;
          if (inter(b, sb, 2) && !contained) out.push(`STRADDLES ${el.tagName} "${t.s}"`);
        }
      }
      return out;
  });
  total += issues.length;
  console.log(`${issues.length ? 'FAIL' : 'ok  '} ${file}${issues.length ? '\n     ' + issues.join('\n     ') : ''}`);
}
await browser.close();
console.log(total ? `${total} layout issue(s) found.` : 'All illustrations passed.');
process.exit(total ? 1 : 0);
