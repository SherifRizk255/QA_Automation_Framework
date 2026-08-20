import { test as base } from '@playwright/test';
import { PageObjectManager } from '../pages/PageObjectManager';

type FrameworkFixtures = {
  /** One controlled access point to all page objects for the default page (GUIDELINES §8). */
  pom: PageObjectManager;
};

/**
 * The ONE test.extend file for the framework (GUIDELINES §folder-conventions).
 * Never create a second fixtures file — add new fixtures here.
 *
 * As the project grows, add higher-level fixtures alongside `pom`, e.g. an
 * `authenticatedPom` that logs in through the portal LoginPage and returns a
 * ready session, or workflow fixtures that land on a specific hub. Each new
 * fixture composes `pom` and the relevant page objects — see skill 19
 * (Authentication / Session Manager) for the login-session pattern.
 */
export const test = base.extend<FrameworkFixtures>({
  pom: async ({ page }, use) => {
    await use(new PageObjectManager(page));
  },
});

export { expect } from '@playwright/test';
