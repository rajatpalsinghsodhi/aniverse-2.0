#!/usr/bin/env node
/**
 * Capture AnimeVerse app screenshots for dragging into Figma.
 * Run with app already running: npm run dev (then in another terminal: node scripts/screenshot-for-figma.mjs)
 *
 * Usage:
 *   node scripts/screenshot-for-figma.mjs [baseUrl] [viewport]
 *   node scripts/screenshot-for-figma.mjs http://localhost:5173 1440x900
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const baseUrl = process.argv[2] || 'http://localhost:5173';
const viewportArg = process.argv[3] || '1440x900';
const [width, height] = viewportArg.split('x').map(Number) || [1440, 900];
const outDir = join(__dirname, '..', 'figma-screenshots');

async function main() {
  let browser;
  try {
    const dynamicImport = await import('puppeteer');
    const puppeteer = dynamicImport.default;
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 15000 });

    await mkdir(outDir, { recursive: true });
    const filename = `animeverse-${width}x${height}-${Date.now()}.png`;
    const filepath = join(outDir, filename);
    await page.screenshot({ path: filepath, type: 'png' });
    console.log('Screenshot saved:', filepath);
    console.log('Drag this file into Figma to add it as an image (or use Place image).');
  } catch (err) {
    if (err.message?.includes('Cannot find module') || err.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('Install Puppeteer first: npm install -D puppeteer');
      console.error('Then run: node scripts/screenshot-for-figma.mjs', baseUrl);
    } else {
      console.error('Screenshot failed:', err.message);
      console.error('Ensure the app is running: npm run dev');
    }
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
