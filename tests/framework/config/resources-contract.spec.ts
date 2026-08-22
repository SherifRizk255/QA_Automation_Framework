import { expect, test } from '@playwright/test';
import { crmRecordUrl, ENV, portalHashRoute, ROLES, ROUTES, TEST_DATA } from '../../../config/resources.js';

test.describe('IScore Asset Management - resources.ts contract', () => {
  test('TC-FW-ASSET-001 | portal login URL derives from base + login path when no override is set', () => {
    expect(ENV.portal.loginUrl).toBe(`${ENV.portal.baseUrl}${ENV.portal.loginPath}`);
  });

  test('TC-FW-ASSET-002 | portal Tagging hash route composes onto a login URL', () => {
    const taggingUrl = portalHashRoute(ROUTES.portal.tagging, 'https://example.test/portal/#/login');
    expect(taggingUrl).toBe('https://example.test/portal/#/tagging');
  });

  test('TC-FW-ASSET-003 | crm origin/routePattern derive from the configured base URL', () => {
    const baseUrl = new URL(ENV.crm.baseUrl);
    expect(ENV.crm.origin).toBe(baseUrl.origin);
    expect(ENV.crm.routePattern).toBe(`${baseUrl.origin}/**`);
  });

  test('TC-FW-ASSET-004 | crmRecordUrl builds an entityrecord URL, not an entitylist URL', () => {
    const url = crmRecordUrl({ orgPath: '/ISCORE', entityName: 'cis_users', id: 'abc-123' });
    const parsed = new URL(url);

    expect(parsed.pathname).toBe('/ISCORE/main.aspx');
    expect(parsed.searchParams.get('pagetype')).toBe('entityrecord');
    expect(parsed.searchParams.get('etn')).toBe('cis_users');
    expect(parsed.searchParams.get('id')).toBe('abc-123');
  });

  test('TC-FW-ASSET-005 | ROUTES.crm.userRecord targets the cis_users entity', () => {
    const parsed = new URL(ROUTES.crm.userRecord);
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
      expect(storageStatePath).toMatch(/^\.auth\/.*-state\.json$/);
    }
  });

  test('TC-FW-ASSET-007 | tagging test data carries env-overridable defaults', () => {
    expect(TEST_DATA.tagging.multiSelectCount).toBeGreaterThan(0);
    expect(TEST_DATA.tagging.filterFieldLabel.length).toBeGreaterThan(0);
    expect(TEST_DATA.tagging.filterNoMatchValue.length).toBeGreaterThan(0);
  });
});
