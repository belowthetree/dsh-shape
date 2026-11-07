// Capture the dsh-shape demo as a deterministic PNG sequence.
//
// The page exposes `window.__seek(ms)` and renders from that time alone, so the
// capture is not tied to wall-clock speed: every frame is exact.
//
// Usage: node record.mjs [outputDir]
import { createRequire } from 'node:module'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire('E:/Project/deepseek-harness/package.json')

/** Resolve Playwright from the checkout's pnpm store or a normal install. */
function loadPlaywright() {
  const candidates = [
    'E:/Project/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright',
    'E:/Project/deepseek-harness/node_modules/playwright',
    'playwright',
  ]
  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch {
      // Try the next location.
    }
  }
  throw new Error('playwright not found')
}

const { chromium } = loadPlaywright()

const FPS = 30
const DURATION_MS = 36000
const WIDTH = 1280
const HEIGHT = 720
const SCALE = 1.5

const outDir = process.argv[2] ?? 'E:/Project/dsh-plugins/dsh-shape/demo/.frames'
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.SHAPE_CHROME
    ?? 'C:/Users/ZGG/AppData/Local/ms-playwright/chromium-1169/chrome-win/chrome.exe',
})
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
})
await page.goto('file:///E:/Project/dsh-plugins/dsh-shape/demo/demo.html')
await page.evaluate(() => document.fonts?.ready)
await page.waitForTimeout(250)

const total = Math.round((DURATION_MS / 1000) * FPS)
const started = Date.now()
for (let frame = 0; frame < total; frame++) {
  const ms = (frame * 1000) / FPS
  await page.evaluate((time) => window.__seek(time), ms)
  await page.screenshot({ path: join(outDir, `f${String(frame).padStart(4, '0')}.png`) })
  if (frame % 90 === 0) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1)
    console.log(`frame ${String(frame)}/${String(total)} (${elapsed}s)`)
  }
}

await browser.close()
console.log(`captured ${String(total)} frames into ${outDir}`)
