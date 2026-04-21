import { chromium, devices } from 'playwright';
import fs from 'fs/promises';

const base = 'http://127.0.0.1:4175/environment-quiz.html';
const outDir = '/Users/jacobrozansky/exef/output/playwright';

async function inspectPage(page, label) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(150);

  const metrics = await page.evaluate(() => {
    const legend = document.querySelector('.environment-group .esqr-skill-group__legend');
    const rating = document.querySelector('.environment-rating');
    const leftLabel = rating?.querySelector('.environment-rating__label--low');
    const scale = rating?.querySelector('.environment-rating__scale');
    const rightLabel = rating?.querySelector('.environment-rating__label--high');
    const tooltipTrigger = document.querySelector('.environment-term');

    if (tooltipTrigger instanceof HTMLElement) tooltipTrigger.focus();

    const legendStyle = legend ? getComputedStyle(legend) : null;
    const labelRects = leftLabel && scale && rightLabel ? {
      left: leftLabel.getBoundingClientRect().toJSON(),
      scale: scale.getBoundingClientRect().toJSON(),
      right: rightLabel.getBoundingClientRect().toJSON()
    } : null;
    const tooltipStyle = tooltipTrigger ? getComputedStyle(tooltipTrigger, '::after') : null;

    return {
      legend: legendStyle ? {
        color: legendStyle.color,
        background: legendStyle.backgroundColor,
        boxShadow: legendStyle.boxShadow
      } : null,
      ratingRow: labelRects ? {
        leftRightAligned: Math.abs(labelRects.left.top - labelRects.scale.top) < 8,
        rightRightAligned: Math.abs(labelRects.right.top - labelRects.scale.top) < 8,
        leftEndsBeforeScale: labelRects.left.right <= labelRects.scale.left + 2,
        rightStartsAfterScale: labelRects.right.left >= labelRects.scale.right - 2,
        left: labelRects.left,
        scale: labelRects.scale,
        right: labelRects.right
      } : null,
      tooltip: tooltipStyle ? {
        opacity: tooltipStyle.opacity,
        content: tooltipStyle.content,
        width: tooltipStyle.width
      } : null
    };
  });

  await page.screenshot({ path: outDir + '/' + label + '.png', fullPage: true });
  return metrics;
}

const browser = await chromium.launch({ headless: true });

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 2200 }
});
const desktopPage = await desktopContext.newPage();
const desktop = await inspectPage(desktopPage, 'environment-ui-desktop');
await desktopContext.close();

const mobileContext = await browser.newContext({
  ...devices['iPhone 13']
});
const mobilePage = await mobileContext.newPage();
const mobile = await inspectPage(mobilePage, 'environment-ui-mobile');
await mobileContext.close();

await browser.close();

const result = { desktop, mobile };
await fs.writeFile(outDir + '/environment-ui-check.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
