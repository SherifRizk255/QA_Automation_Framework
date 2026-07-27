import { expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type LocatorDefinition = {
  type: 'role' | 'text' | 'css' | 'label' | 'placeholder';
  value: string;
  name?: string;
  exact?: boolean;
  includeHidden?: boolean;
  hasText?: string;
};

type LocatorParameters = Readonly<Record<string, string>>;

type LocatorOptions = {
  readonly scope?: Locator;
  readonly parameters?: LocatorParameters;
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

function toRegex(value: string): string | RegExp {
  if (value.startsWith('/') && value.endsWith('/i')) {
    return new RegExp(value.slice(1, -2), 'i');
  }

  if (value.startsWith('/') && value.endsWith('/')) {
    return new RegExp(value.slice(1, -1));
  }

  return value;
}

function replaceParameters(value: string, parameters: LocatorParameters = {}): string {
  let resolved = value;

  for (const [name, replacement] of Object.entries(parameters)) {
    resolved = resolved.replaceAll(`{{${name}}}`, replacement);
  }

  if (resolved.includes('{{')) {
    throw new Error(`Locator repository parameters are incomplete for: ${value}`);
  }

  return resolved;
}

function buildLocator(
  root: Page | Locator,
  definition: LocatorDefinition,
  parameters?: LocatorParameters
): Locator {
  const rawValue = replaceParameters(definition.value, parameters);
  const value = toRegex(rawValue);
  const rawName = definition.name
    ? replaceParameters(definition.name, parameters)
    : undefined;
  let locator: Locator;

  if (definition.type === 'role') {
    locator = root.getByRole(rawValue as Parameters<Page['getByRole']>[0], {
      name: rawName ? toRegex(rawName) : undefined,
      exact: definition.exact,
      includeHidden: definition.includeHidden,
    });
  } else if (definition.type === 'text') {
    locator = root.getByText(value, { exact: definition.exact });
  } else if (definition.type === 'label') {
    locator = root.getByLabel(value, { exact: definition.exact });
  } else if (definition.type === 'placeholder') {
    locator = root.getByPlaceholder(value);
  } else {
    locator = root.locator(rawValue);
  }

  if (definition.hasText) {
    const hasText = replaceParameters(definition.hasText, parameters);
    locator = locator.filter({ hasText: toRegex(hasText) });
  }

  return locator;
}

export class LocatorRepository {
  constructor(private readonly page: Page) {}

  resolve(elementId: string, options: LocatorOptions = {}): Locator {
    const entry = loadRepository().entries.find((item) => item.elementId === elementId);

    if (!entry) {
      throw new Error(`Locator repository entry not found: ${elementId}`);
    }

    usage[elementId] = (usage[elementId] ?? 0) + 1;

    return buildLocator(options.scope ?? this.page, entry.primary, options.parameters);
  }

  locator(elementId: string, options: LocatorOptions = {}): Locator {
    return this.resolve(elementId, options);
  }

  async validateVisible(elementId: string, options: LocatorOptions = {}): Promise<Locator> {
    const entry = loadRepository().entries.find((item) => item.elementId === elementId);

    if (!entry) {
      throw new Error(`Locator repository entry not found: ${elementId}`);
    }

    usage[elementId] = (usage[elementId] ?? 0) + 1;

    const candidates = [entry.primary, ...entry.fallbackChain];

    for (const candidate of candidates) {
      const locator = buildLocator(
        options.scope ?? this.page,
        candidate,
        options.parameters
      );
      const count = await locator.count().catch(() => 0);
      const visible = count === 1 ? await locator.isVisible().catch(() => false) : false;

      if (count === 1 && visible) {
        await expect(locator).toBeVisible();
        return locator;
      }
    }

    const primary = buildLocator(
      options.scope ?? this.page,
      entry.primary,
      options.parameters
    );
    await expect(primary).toBeVisible();
    return primary;
  }
}

export function getLocatorRepositoryUsage(): Readonly<Record<string, number>> {
  return { ...usage };
}
