import { expect, test } from '@playwright/test';
import { crmRecordUrl, ENV, portalHashRoute, ROLES, ROUTES, TEST_DATA } from '../../../config/resources.js';

test.describe('IScore Asset Management - resources.ts contract', () => {
  test('TC-FW-ASSET-001 | assetPortal login URL derives from base + login path when no override is set', () => {
    expect(ENV.assetPortal.loginUrl).toBe(`${ENV.assetPortal.baseUrl}${ENV.assetPortal.loginPath}`);
  });

  test('TC-FW-ASSET-002 | assetPortal Tagging hash route composes onto a login URL', () => {
    const taggingUrl = portalHashRoute(ROUTES.assetPortal.tagging, 'https://example.test/portal/#/login');
    expect(taggingUrl).toBe('https://example.test/portal/#/tagging');
  });

  test('TC-FW-ASSET-003 | assetCrm origin/routePattern derive from the configured base URL', () => {
    const baseUrl = new URL(ENV.assetCrm.baseUrl);
    expect(ENV.assetCrm.origin).toBe(baseUrl.origin);
    expect(ENV.assetCrm.routePattern).toBe(`${baseUrl.origin}/**`);
  });

  test('TC-FW-ASSET-004 | crmRecordUrl builds an entityrecord URL, not an entitylist URL', () => {
    const url = crmRecordUrl({ orgPath: '/ISCORE', entityName: 'cis_users', id: 'abc-123' });
    const parsed = new URL(url);

    expect(parsed.pathname).toBe('/ISCORE/main.aspx');
    expect(parsed.searchParams.get('pagetype')).toBe('entityrecord');
    expect(parsed.searchParams.get('etn')).toBe('cis_users');
    expect(parsed.searchParams.get('id')).toBe('abc-123');
  });

  test('TC-FW-ASSET-005 | ROUTES.assetCrm.userRecord targets the cis_users entity', () => {
    const parsed = new URL(ROUTES.assetCrm.userRecord);
    expect(parsed.searchParams.get('etn')).toBe('cis_users');
    expect(parsed.searchParams.get('pagetype')).toBe('entityrecord');
  });

  test('TC-FW-ASSET-006 | ROLES defines three distinct roles with distinct storage state paths', () => {
    const roleKeys = Object.keys(ROLES) as Array<keyof typeof ROLES>;
    expect(roleKeys).toEqual(['MAKER', 'CHECKER', 'FINANCE_CHECKER']);

    const crmFieldValues = roleKeys.map((key) => ROLES[key].crmFieldValue);
    expect(new Set(crmFieldValues).size).toBe(roleKeys.length);

    const storageStatePaths = roleKeys.map((key) => ROLES[key].storageStatePath);
    expect(new Set(storageStatePaths).size).toBe(roleKeys.length);

    for (const storageStatePath of storageStatePaths) {
      expect(storageStatePath).toMatch(/^\.auth\/asset-.*-state\.json$/);
    }
  });

  test('TC-FW-ASSET-007 | assetTagging test data carries env-overridable defaults', () => {
    expect(TEST_DATA.assetTagging.multiSelectCount).toBeGreaterThan(0);
    expect(TEST_DATA.assetTagging.filterFieldLabel.length).toBeGreaterThan(0);
    expect(TEST_DATA.assetTagging.filterNoMatchValue.length).toBeGreaterThan(0);
  });
});
