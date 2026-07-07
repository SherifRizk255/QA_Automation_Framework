import { expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type LocatorDefinition = {
  type: 'role' | 'text' | 'css' | 'label' | 'placeholder';
  value: string;
  name?: string;
  exact?: boolean;
};

type LocatorRepositoryEntry = {
  elementId: string;
  screenName: string;
  elementName: string;
  primary: LocatorDefinition;
  fallbackChain: LocatorDefinition[];
};

const repositoryPath = path.resolve('docs', 'analysis', 'locator-repository.json');
const usage: Record<string, number> = {};

function loadRepository(): { entries: LocatorRepositoryEntry[] } {
  return JSON.parse(fs.readFileSync(repositoryPath, 'utf-8'));
}

function toRegex(value: string) {
  if (value.startsWith('/') && value.endsWith('/i')) {
    return new RegExp(value.slice(1, -2), 'i');
  }

  if (value.startsWith('/') && value.endsWith('/')) {
    return new RegExp(value.slice(1, -1));
  }

  return value;
}

function buildLocator(page: Page, definition: LocatorDefinition): Locator {
  const value = toRegex(definition.value);

  if (definition.type === 'role') {
    return page.getByRole(definition.value as Parameters<Page['getByRole']>[0], {
      name: definition.name ? toRegex(definition.name) : undefined,
      exact: definition.exact,
    });
  }

  if (definition.type === 'text') {
    return page.getByText(value, { exact: definition.exact });
  }

  if (definition.type === 'label') {
    return page.getByLabel(value, { exact: definition.exact });
  }

  if (definition.type === 'placeholder') {
    return page.getByPlaceholder(value);
  }

  return page.locator(definition.value);
}

export class LocatorRepository {
  constructor(private readonly page: Page) {}

  locator(elementId: string): Locator {
    const entry = loadRepository().entries.find((item) => item.elementId === elementId);

    if (!entry) {
      throw new Error(`Locator repository entry not found: ${elementId}`);
    }

    usage[elementId] = (usage[elementId] ?? 0) + 1;

    return buildLocator(this.page, entry.primary);
  }

  async validateVisible(elementId: string) {
    const entry = loadRepository().entries.find((item) => item.elementId === elementId);

    if (!entry) {
      throw new Error(`Locator repository entry not found: ${elementId}`);
    }

    usage[elementId] = (usage[elementId] ?? 0) + 1;

    const candidates = [entry.primary, ...entry.fallbackChain];

    for (const candidate of candidates) {
      const locator = buildLocator(this.page, candidate);
      const count = await locator.count().catch(() => 0);
      const visible = count === 1 ? await locator.isVisible().catch(() => false) : false;

      if (count === 1 && visible) {
        await expect(locator).toBeVisible();
        return locator;
      }
    }

    await expect(buildLocator(this.page, entry.primary)).toBeVisible();
    return buildLocator(this.page, entry.primary);
  }
}

export function getLocatorRepositoryUsage() {
  return { ...usage };
}
