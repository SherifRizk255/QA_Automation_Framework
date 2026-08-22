import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

type LocatorRepositoryEntry = {
  elementId: string;
  screenName: string;
  owner: string;
  scope: string;
  primary: { type: string };
  repositoryStatus?: string;
};

function loadRepository(): { entries: LocatorRepositoryEntry[] } {
  const repositoryPath = path.resolve('docs', 'analysis', 'locator-repository.json');
  return JSON.parse(fs.readFileSync(repositoryPath, 'utf-8'));
}

function assetEntries(entries: LocatorRepositoryEntry[]): LocatorRepositoryEntry[] {
  return entries.filter((entry) => entry.elementId.startsWith('ASSET.'));
}

const SUPPORTED_LOCATOR_TYPES = new Set(['role', 'text', 'css', 'label', 'placeholder']);

test.describe('IScore Asset Management - locator repository integrity', () => {
  test('TC-FW-ASSET-010 | Every repository elementId is unique', () => {
    const { entries } = loadRepository();
    const elementIds = entries.map((entry) => entry.elementId);

    expect(new Set(elementIds).size).toBe(elementIds.length);
  });

  test('TC-FW-ASSET-011 | ASSET.* entries were registered', () => {
    const { entries } = loadRepository();
    expect(assetEntries(entries).length).toBeGreaterThan(0);
  });

  test('TC-FW-ASSET-012 | Every ASSET.* entry has an owner, a screen name, and a resolvable primary locator type', () => {
    const { entries } = loadRepository();

    for (const entry of assetEntries(entries)) {
      expect(entry.owner, entry.elementId).toBeTruthy();
      expect(entry.screenName, entry.elementId).toBeTruthy();
      expect(SUPPORTED_LOCATOR_TYPES.has(entry.primary.type), entry.elementId).toBe(true);
    }
  });

  test('TC-FW-ASSET-013 | Every ASSET.* entry follows the SCREEN.ELEMENT naming convention', () => {
    const { entries } = loadRepository();

    for (const entry of assetEntries(entries)) {
      expect(entry.elementId, entry.elementId).toMatch(/^ASSET(\.[A-Z0-9_]+){2,}$/);
    }
  });

  test('TC-FW-ASSET-014 | Every ASSET.* entry is flagged UNVERIFIED pending a live system walkthrough', () => {
    const { entries } = loadRepository();

    for (const entry of assetEntries(entries)) {
      expect(entry.repositoryStatus, entry.elementId).toBe('UNVERIFIED');
    }
  });

  test('TC-FW-ASSET-015 | A scope referencing another entry points at a real elementId', () => {
    const { entries } = loadRepository();
    const elementIds = new Set(entries.map((entry) => entry.elementId));

    for (const entry of assetEntries(entries)) {
      if (entry.scope === 'GLOBAL') {
        continue;
      }

      expect(elementIds.has(entry.scope), `${entry.elementId} scope -> ${entry.scope}`).toBe(true);
    }
  });
});
