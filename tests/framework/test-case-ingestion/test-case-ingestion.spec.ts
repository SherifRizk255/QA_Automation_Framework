import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  ingestTestCases,
  parseJson,
  parseXlsx,
} from '../../../scripts/test-case-ingestion/parse-test-cases.js';

test.describe('generic test-case ingestion', () => {
  test('preserves IDs and multiline XLSX fields', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-intake-'));
    const workbookPath = path.join(directory, 'cases.xlsx');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cases');
    sheet.addRow([
      'TC ID', 'Module', 'Sub-module', 'Title', 'Steps', 'Expected Result',
      'Known API endpoint/fields', 'Known test data', 'Known route/heading',
      'Additional business rules', 'Priority', 'Suite/tags',
    ]);
    sheet.addRow([
      'SAIB-0062', 'Account Management', 'Account Management General', 'Drill-down',
      '1. Open Accounts\n2. Open transaction', 'Details match',
      'POST /accountstatement\nTransaction.Reference', '{"role":"retail"}',
      '{"route":"#/accounts"}', 'Use UI-only selection\nNormalize currency',
      'P1', 'regression,account-management',
    ]);
    await workbook.xlsx.writeFile(workbookPath);

    const [parsed] = await parseXlsx(workbookPath);
    expect(parsed.tcId).toBe('SAIB-0062');
    expect(parsed.steps).toEqual(['Open Accounts', 'Open transaction']);
    expect(parsed.businessRules).toEqual(['Use UI-only selection', 'Normalize currency']);
    expect(parsed.tags).toEqual(['regression', 'account-management']);
  });

  test('rejects duplicate JSON IDs case-insensitively', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-intake-'));
    const jsonPath = path.join(directory, 'cases.json');
    const base = {
      module: 'Accounts',
      subModule: 'History',
      title: 'Title',
      steps: ['Step'],
      expectedResult: 'Expected',
    };
    await fs.writeFile(jsonPath, JSON.stringify({
      testCases: [
        { tcId: 'SAIB-0062', ...base },
        { tcId: 'saib-0062', ...base },
      ],
    }));

    await expect(ingestTestCases(jsonPath)).rejects.toThrow(/Duplicate test-case ID/);
  });

  test('reports contract gaps and approval requirement', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-intake-'));
    const jsonPath = path.join(directory, 'cases.json');
    await fs.writeFile(jsonPath, JSON.stringify({
      testCases: [{
        tcId: 'TC-1',
        module: 'Accounts',
        subModule: 'History',
        title: 'Compare displayed transaction amount with API response',
        steps: ['Navigate to page', 'Select a transaction'],
        expectedResult: 'Amount and date are formatted and match',
      }],
    }));

    const [parsed] = await parseJson(jsonPath);
    expect(parsed.tcId).toBe('TC-1');
    const result = await ingestTestCases(jsonPath);
    expect(result.approvalRequired).toBe(true);
    expect(result.testCases[0].readiness).toBe('Needs contract clarification');
    expect(result.testCases[0].gaps).toContain('API contract');
  });
});
