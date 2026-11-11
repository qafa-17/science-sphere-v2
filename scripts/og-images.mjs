// Makes the share preview images (the picture that shows when someone posts a
// link on Instagram, iMessage, Discord, LinkedIn...). 1200 x 630 PNGs:
//   app/opengraph-image.png   every page, unless it has its own
//   public/og/issue-N.png      each issue's reader page, with its cover
//
// Run it again after adding an issue or changing a cover. It needs Playwright,
// which isn't part of the site, so the first time install it without saving it:
//   npm install --no-save playwright
//   npx playwright install chromium
// then:
//   node scripts/og-images.mjs

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const font = (pkg, file) => pathToFileURL(join(root, "node_modules", pkg, "files", file)).href;
const fonts = `
@font-face { font-family: "Archivo Variable"; font-style: normal; font-stretch: 62% 125%; font-weight: 100 900;
  src: url(${font("@fontsource-variable/archivo", "archivo-latin-wdth-normal.woff2")}) format("woff2-variations"); }
@font-face { font-family: "Space Mono"; font-weight: 400; src: url(${font("@fontsource/space-mono", "space-mono-latin-400-normal.woff2")}); }
@font-face { font-family: "Space Mono"; font-weight: 700; src: url(${font("@fontsource/space-mono", "space-mono-latin-700-normal.woff2")}); }`;

// The issues, read straight from lib/issues.ts so this stays in step with the site.
const src = readFileSync(join(root, "lib/issues.ts"), "utf8");
const issues = [...src.matchAll(/id: "(\d+)",\s*number: (\d+),\s*season: "([^"]+)",[\s\S]*?cover: "([^"]+)"/g)].map((m) => ({
  id: m[1],
  number: m[2],
  season: m[3],
  cover: pathToFileURL(join(root, "public", m[4])).href,
}));

// The landing page's sphere: dots on a globe, joined to their neighbours, over a starry sky.
const sky = `
<canvas id="c" width="2400" height="1260"></canvas>
<script>
  const c = document.getElementById("c"), g = c.getContext("2d");
  g.scale(2, 2);
  const grad = g.createLinearGradient(0, 0, 0, 630);
  grad.addColorStop(0, "#0d0630"); grad.addColorStop(1, "#18314f");
  g.fillStyle = grad; g.fillRect(0, 0, 1200, 630);
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = "rgba(220,227,238," + (0.15 + rnd() * 0.5) + ")";
    g.beginPath(); g.arc(rnd() * 1200, rnd() * 630, rnd() * 1.3 + 0.2, 0, 7); g.fill();
  }
  const cx = window.SPHERE_X, cy = 315, R = window.SPHERE_R, n = 150, pts = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.39996 + 0.6;
    const x = Math.cos(t) * r, z = Math.sin(t) * r;
    const tilt = 0.35, y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    pts.push({ x: cx + x * R, y: cy + y2 * R, z: z2 });
  }
  g.lineWidth = 0.8;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < R * 0.32) {
      g.strokeStyle = "rgba(139,190,178," + (0.12 + 0.22 * (a.z + b.z + 2) / 4) + ")";
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
  }
  for (const p of pts) {
    const k = (p.z + 1) / 2;
    g.fillStyle = rnd() < 0.08 ? "#caac4b" : "rgba(230,249,175," + (0.35 + k * 0.6) + ")";
    g.beginPath(); g.arc(p.x, p.y, 1.2 + k * 2.2, 0, 7); g.fill();
  }
</script>`;

const base = `
${fonts}
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #e6f9af; }
canvas { position: absolute; inset: 0; width: 1200px; height: 630px; }
.label { font-family: "Space Mono"; font-size: 22px; letter-spacing: 0.1em; text-transform: uppercase; color: #dce3ee; }
.title { font-family: "Archivo Variable"; font-weight: 800; font-stretch: 125%; text-transform: uppercase; line-height: 0.92; letter-spacing: -0.01em;
  text-shadow: 0 0 40px rgba(230,249,175,0.25); }
.mono { font-family: "Space Mono"; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 64px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 56px; background: #e6f9af; color: #0d0630; font-family: "Space Mono"; font-weight: 700; font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; }
.prompt { position: absolute; top: 44px; left: 56px; }`;

const sitePage = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
.center { position: absolute; left: 0; right: 0; top: 108px; text-align: center; }
.title { font-size: 150px; }
.tag { margin-top: 30px; }
</style><script>window.SPHERE_X = 600; window.SPHERE_R = 270;</script></head><body>
${sky}
<p class="label prompt">&gt; sci_sphere.sys // online_</p>
<div class="center">
  <h1 class="title">Science<br>Sphere</h1>
  <p class="label tag">The MRU science experience</p>
</div>
<div class="bar"><span>Student science magazine</span><span>Mount Royal University</span></div>
</body></html>`;

const issuePage = (issue) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}
.cover { position: absolute; top: 56px; right: 96px; height: 470px; transform: rotate(3deg);
  box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(230,249,175,0.25); }
.text { position: absolute; left: 56px; top: 120px; width: 640px; }
.title { font-size: 136px; }
.season { margin-top: 26px; font-size: 26px; }
.cta { margin-top: 30px; font-family: "Space Mono"; font-size: 24px; color: #e6f9af; }
</style><script>window.SPHERE_X = 900; window.SPHERE_R = 300;</script></head><body>
${sky}
<p class="label prompt">&gt; science_sphere // issue_${issue.number.padStart(2, "0")}</p>
<div class="text">
  <h1 class="title">Issue<br>#${issue.number}</h1>
  <p class="label season">${issue.season}</p>
  <p class="cta">Read it free, right on the site →</p>
</div>
<img class="cover" src="${issue.cover}" alt="">
<div class="bar"><span>Science Sphere</span><span>Mount Royal University</span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
page.on("pageerror", (e) => console.error(e));
// written to a file first, so the page may load the fonts and covers from disk
const tmp = mkdtempSync(join(tmpdir(), "og-"));
async function shoot(html, out) {
  const file = join(tmp, "page.html");
  writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await page.screenshot({ type: "png" }));
  console.log("made", out.replace(root + "/", ""));
}
await shoot(sitePage, join(root, "app/opengraph-image.png"));
for (const issue of issues) await shoot(issuePage(issue), join(root, "public/og", `issue-${issue.id}.png`));
await browser.close();
rmSync(tmp, { recursive: true });
