/**
 * Smoke tests for the Electron app.
 * Prerequisite: run `pnpm build` before executing these tests.
 *
 * Why manual spawn instead of `_electron.launch()`:
 *   Playwright can pass invalid `--remote-debugging-port=0` for Electron, and
 *   recent Electron (30+/41+) no longer accepts `--remote-debugging-port` as a
 *   CLI flag — CDP is enabled in main via `app.commandLine.appendSwitch` (see
 *   src/main/index.ts) using env CLEANUP_PHOTOS_E2E_CDP_PORT. We spawn Electron
 *   with that env set, pick a free port, and connect over CDP.
 */
import { test, expect, chromium } from '@playwright/test'
import type { Browser, Locator, Page } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { resolve } from 'node:path'

const ELECTRON_BIN = resolve(
  __dirname,
  '../../node_modules/electron/dist',
  readFileSync(resolve(__dirname, '../../node_modules/electron/path.txt'), 'utf-8').trim()
)
const PROJECT_ROOT = resolve(__dirname, '../..')
const CDP_HOST = '127.0.0.1'

async function findFreePort(): Promise<number> {
  return new Promise((res) => {
    const s = createServer()
    s.listen(0, CDP_HOST, () => {
      const { port } = s.address() as { port: number }
      s.close(() => res(port))
    })
  })
}

async function waitForCDP(
  url: string,
  electronProcess: ChildProcess,
  getElectronOutput: () => string,
  timeoutMs = 20_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${url}/json/version`)
      if (r.ok) {
        return
      }
    } catch {
      if (electronProcess.exitCode !== null || electronProcess.signalCode !== null) {
        throw new Error(
          `Electron exited before CDP started.\n${getElectronOutput() || '(no Electron output)'}`
        )
      }
      await new Promise((r) => setTimeout(r, 300))
    }
  }
  throw new Error(
    `Electron CDP at ${url} did not start within ${timeoutMs} ms.\n${
      getElectronOutput() || '(no Electron output)'
    }`
  )
}

let proc: ChildProcess
let browser: Browser
let page: Page

function navButton(label: string): Locator {
  return page.getByRole('navigation').getByRole('button', { name: label })
}

test.beforeAll(async () => {
  const port = await findFreePort()
  const cdpEndpoint = `http://${CDP_HOST}:${port}`
  const electronEnv = { ...process.env, CLEANUP_PHOTOS_E2E_CDP_PORT: String(port) }
  delete electronEnv.ELECTRON_RUN_AS_NODE
  let electronOutput = ''

  // Use '.' as the entry (not an absolute path) with cwd=PROJECT_ROOT — this
  // mirrors how electron-vite spawns the process and ensures pnpm's module
  // resolution correctly finds the built-in 'electron' module.
  proc = spawn(ELECTRON_BIN, ['.'], {
    cwd: PROJECT_ROOT,
    env: electronEnv
  })
  proc.stdout?.on('data', (chunk) => {
    electronOutput += chunk
  })
  proc.stderr?.on('data', (chunk) => {
    electronOutput += chunk
  })

  await waitForCDP(cdpEndpoint, proc, () => electronOutput)

  browser = await chromium.connectOverCDP(cdpEndpoint)
  const [ctx] = browser.contexts()
  page = ctx.pages()[0] ?? (await ctx.waitForEvent('page'))
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await browser?.close()
  proc?.kill()
})

test('window opens and renders the app shell', async () => {
  await expect(page.locator('body')).toBeVisible()
})

test('sidebar shows all navigation tabs', async () => {
  for (const label of ['Scan', 'Duplicates', 'Organize', 'Quality', 'Export', 'Settings']) {
    await expect(navButton(label)).toBeVisible()
  }
})

test('Scanner is active by default and shows empty state', async () => {
  await expect(page.getByRole('heading', { level: 1, name: 'Scan Folder' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Choose a folder to scan' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Choose Folder' })).toBeVisible()
})

test('navigating to Duplicates shows its panel header', async () => {
  await navButton('Duplicates').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Duplicates' })).toBeVisible()
})

test('navigating back to Scan restores Scanner panel', async () => {
  await navButton('Scan').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Scan Folder' })).toBeVisible()
})

test('all remaining tabs open without error', async () => {
  for (const [label, heading] of [
    ['Organize', 'Organize'],
    ['Quality', 'Quality'],
    ['Export', 'Export'],
    ['Settings', 'Settings']
  ] as const) {
    await navButton(label).click()
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})
