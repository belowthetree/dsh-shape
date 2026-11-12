
import { createRequire } from 'node:module'
const r = createRequire('E:/Project/deepseek-harness/package.json')
const pw = r('E:/Project/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright')
const b = await pw.chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})
const p = await b.newPage()
await p.goto('about:blank')
console.log('PLAYWRIGHT-LAUNCH-OK', await b.version())
await b.close()
