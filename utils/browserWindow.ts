import { type Page } from '@playwright/test';

/**
 * Maximizes the OS window that owns `page` via the Chrome DevTools Protocol.
 *
 * Why CDP and not just `--start-maximized`:
 *  - `--start-maximized` is unreliable when combined with other window args
 *    (e.g. `--window-size`, which Chromium honors instead) and only affects the
 *    FIRST window — a window opened by `browser.newContext()` never receives it.
 *  - `Browser.setWindowBounds({ windowState: 'maximized' })` maximizes each
 *    window deterministically in headed Chromium, per context.
 *
 * Safe no-op in headless / non-Chromium (no OS window manager) — the CDP call
 * throws and is swallowed.
 */
export async function maximizeWindow(page: Page): Promise<void> {
  try {
    const session = await page.context().newCDPSession(page);
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', {
      windowId,
      bounds: { windowState: 'maximized' },
    });
    await session.detach();
  } catch {
    // Headless or non-Chromium: there is no OS window to maximize.
  }
}

/**
 * Debug helper: logs the real window/screen dimensions when LOG_WINDOW_SIZE is
 * set, so a maximized window can be proven (outerW ≈ availW, outerH ≈ availH).
 * Off by default — no output in normal runs.
 */
export async function logWindowSize(label: string, page: Page): Promise<void> {
  if (!process.env.LOG_WINDOW_SIZE) return;
  const size = await page.evaluate(() => ({
    outerW: window.outerWidth,
    outerH: window.outerHeight,
    screenW: window.screen.availWidth,
    screenH: window.screen.availHeight,
    viewport: { w: window.innerWidth, h: window.innerHeight },
  }));
  console.log(`WINDOW SIZE [${label}]:`, JSON.stringify(size));
}
