
import { createRequire } from 'node:module'
const r = createRequire('E:/Project/deepseek-harness/package.json')
const pw = r('E:/Project/deepseek-harness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright')
const crypto = await import('node:crypto')
const enc = (b) => Buffer.from(b).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
const secret = Buffer.from('3L2IuAVP0_4OiNde_OT3hJKXJACUlZ2qvMZw80pB-YU'.replaceAll('-','+').replaceAll('_','/') + '=', 'base64')
const authority = '127.0.0.1:12374'
const now = Date.now()
const body = enc(Buffer.from(JSON.stringify({ version: 1, authority, issuedAt: now, expiresAt: now + 7*86400000 }), 'utf8'))
const sig = enc(crypto.createHmac('sha256', secret).update(body).digest())
const cookieName = 'dsh-auth-' + enc(crypto.createHash('sha256').update(authority).digest())

const OUT = 'E:/Project/dsh-plugins/dsh-shape/.research/shots'
const browser = await pw.chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--lang=zh-CN'],
})
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, locale: 'zh-CN', colorScheme: 'dark' })
await ctx.addCookies([{ name: cookieName, value: 'v1.' + body + '.' + sig, domain: '127.0.0.1', path: '/' }])
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
await page.goto('http://127.0.0.1:12374/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(10000)
const states = {}
const snap = async (name, textLimit = 700) => {
  await page.screenshot({ path: OUT + '/' + name + '.png' })
  states[name] = await page.evaluate((n) => ({
    text: (document.body.innerText || '').slice(0, n),
    inputs: [...document.querySelectorAll('input,textarea,[contenteditable]')].slice(0, 8).map(e => (e.getAttribute('placeholder') || e.tagName).slice(0, 30)),
  }), textLimit)
}
await snap('raw-00-app')
await page.keyboard.press('Control+Period')
await page.waitForTimeout(1400)
await snap('raw-01-browser', 1200)
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
await page.keyboard.press('Control+Alt+KeyW')
await page.waitForTimeout(1600)
await snap('raw-02-workbench', 1200)
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
await page.keyboard.press('Control+KeyF')
await page.waitForTimeout(900)
await snap('raw-03-search', 700)
await page.keyboard.press('Escape')
await browser.close()
console.log(JSON.stringify({ states, errors }, null, 1).slice(0, 8000))
