#!/usr/bin/env node
// Render Tally app icon set from inline SVGs to PNG.
//
// Outputs (1024x1024):
//   assets/icon.png           — iOS App Store + iOS home screen. RGB, no alpha.
//   assets/adaptive-icon.png  — Android adaptive foreground. RGBA, transparent canvas.
//   assets/splash-icon.png    — splash screen glyph. RGBA, transparent canvas.
//
// Design: paper canvas (#FAFAF7), three dusty-teal (#3F7D7D) arc segments
// forming a donut (the signature category-breakdown chart shape), with the
// approval green (#1F8A4C) check tile in the bottom-right corner.
//
// Run from tally repo root:  node scripts/build-icon.mjs

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const assetsDir = path.join(repoRoot, 'assets');

const PAPER = '#FAFAF7';
const TEAL = '#3F7D7D';
const APPROVAL_GREEN = '#1F8A4C';
const SIZE = 1024;

// Polar coords on a circle centered at (cx, cy) with radius r, deg measured
// clockwise from 12 o'clock.
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// SVG path for an arc segment of a circle (stroke-only — outer stroke draws
// the donut ring).
function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const sweep = endDeg - startDeg;
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// Glyph: three teal arc segments stacked into a donut, with hairline-width
// paper gaps between them. The proportions match the in-app donut:
// a large segment (the "biggest expense category"), a medium one, a smaller
// one. Total sweep < 360° on purpose so the icon reads as "in progress / mid
// month," not a closed ring.
function glyphSvg() {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const stroke = 132;
  const r = (SIZE * 0.62) / 2; // ring radius from center
  const gap = 6; // angular gap between segments in degrees
  // Cursor starts at 12 o'clock and runs clockwise.
  // Segments: 165° / 95° / 70° (sum 330°, leaves 30° open at top).
  const segments = [165, 95, 70];
  let cursor = 15; // start a bit after 12 to keep the gap pleasingly off-center
  const arcs = [];
  for (const sweep of segments) {
    arcs.push(`<path d="${arcPath(cx, cy, r, cursor, cursor + sweep)}" stroke="${TEAL}" stroke-width="${stroke}" fill="none" stroke-linecap="butt"/>`);
    cursor += sweep + gap;
  }
  return arcs.join('\n      ');
}

function approvalCornerSvg() {
  const tile = 160;
  const margin = 56;
  const x = SIZE - tile - margin;
  const y = SIZE - tile - margin;
  const s = tile / 24;
  const tx = (n) => x + n * s;
  const ty = (n) => y + n * s;
  return `
      <rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="36" ry="36" fill="${APPROVAL_GREEN}"/>
      <polyline points="${tx(6)},${ty(12.5)} ${tx(10.5)},${ty(17)} ${tx(18)},${ty(8.5)}"
        fill="none" stroke="${PAPER}" stroke-width="${2.6 * s}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
    <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>
    ${glyphSvg()}
    ${approvalCornerSvg()}
  </svg>`;
}

function adaptiveSvg() {
  // Android adaptive foreground: transparent canvas, glyph sized inside the
  // central 66% safe area so circle/squircle masks don't crop it.
  // No corner check — corner gets cropped on circular masks.
  const scale = 0.66;
  const tx = (1 - scale) * SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
    <g transform="translate(${tx} ${tx}) scale(${scale})">
      ${glyphSvg()}
    </g>
  </svg>`;
}

function splashSvg() {
  // Splash: glyph only, transparent bg. ~40% of canvas so it sits comfortably
  // with `resizeMode: contain` against the paper splash bg.
  const scale = 0.4;
  const tx = (1 - scale) * SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
    <g transform="translate(${tx} ${tx}) scale(${scale})">
      ${glyphSvg()}
    </g>
  </svg>`;
}

function wrapHtml(svg, bg) {
  const bgCss = bg || 'transparent';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;background:${bgCss};}
    svg{display:block;width:${SIZE}px;height:${SIZE}px;}
  </style></head><body>${svg}</body></html>`;
}

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('No Chrome/Edge found. Set CHROME_PATH.');
}

function renderHtmlToPng(html, outPath, { transparent }) {
  const tmpHtml = path.join(os.tmpdir(), `tally-icon-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf8');
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--force-device-scale-factor=1',
    `--window-size=${SIZE},${SIZE}`,
    `--screenshot=${outPath}`,
    '--virtual-time-budget=2000',
  ];
  if (transparent) args.push('--default-background-color=00000000');
  args.push(pathToFileURL(tmpHtml).href);
  const result = spawnSync(findChrome(), args, { stdio: 'pipe' });
  fs.rmSync(tmpHtml, { force: true });
  if (result.status !== 0 || !fs.existsSync(outPath)) {
    throw new Error(`Chrome failed (${result.status}): ${result.stderr?.toString() || ''}`);
  }
}

// Strip alpha from an RGBA PNG → RGB PNG (App Store no-alpha requirement).
function stripAlpha(pngPath, bgHex) {
  const buf = fs.readFileSync(pngPath);
  const png = PNG.sync.read(buf);
  const br = parseInt(bgHex.slice(1, 3), 16);
  const bg = parseInt(bgHex.slice(3, 5), 16);
  const bb = parseInt(bgHex.slice(5, 7), 16);
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    png.data[i]     = Math.round(png.data[i]     * a + br * (1 - a));
    png.data[i + 1] = Math.round(png.data[i + 1] * a + bg * (1 - a));
    png.data[i + 2] = Math.round(png.data[i + 2] * a + bb * (1 - a));
    png.data[i + 3] = 255;
  }
  fs.writeFileSync(pngPath, PNG.sync.write(png, { colorType: 2, inputColorType: 6, inputHasAlpha: true }));
}

function build() {
  fs.mkdirSync(assetsDir, { recursive: true });

  const iconPng = path.join(assetsDir, 'icon.png');
  const adaptivePng = path.join(assetsDir, 'adaptive-icon.png');
  const splashPng = path.join(assetsDir, 'splash-icon.png');

  console.log('Rendering icon.png (iOS, no alpha)...');
  renderHtmlToPng(wrapHtml(iconSvg(), PAPER), iconPng, { transparent: false });
  stripAlpha(iconPng, PAPER);
  console.log(`  ${path.relative(repoRoot, iconPng)}`);

  console.log('Rendering adaptive-icon.png (Android foreground, transparent)...');
  renderHtmlToPng(wrapHtml(adaptiveSvg(), null), adaptivePng, { transparent: true });
  console.log(`  ${path.relative(repoRoot, adaptivePng)}`);

  console.log('Rendering splash-icon.png (transparent)...');
  renderHtmlToPng(wrapHtml(splashSvg(), null), splashPng, { transparent: true });
  console.log(`  ${path.relative(repoRoot, splashPng)}`);

  console.log('\nDone.');
}

build();
