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
      'TC-TAG-ASSET-021', 'Tagging', 'Tagging Advanced Filters', 'Matching filter narrows the grid',
      '1. Expand filters\n2. Apply matching value', 'Grid narrows to matching rows',
      'GET /assets\nAsset.Category', '{"role":"maker"}',
      '{"route":"#/tagging"}', 'Derive filter value from a live row\nNever pin a literal',
      'P1', 'regression,tagging',
    ]);
    await workbook.xlsx.writeFile(workbookPath);

    const [parsed] = await parseXlsx(workbookPath);
    expect(parsed.tcId).toBe('TC-TAG-ASSET-021');
    expect(parsed.steps).toEqual(['Expand filters', 'Apply matching value']);
    expect(parsed.businessRules).toEqual(['Derive filter value from a live row', 'Never pin a literal']);
    expect(parsed.tags).toEqual(['regression', 'tagging']);
  });

  test('rejects duplicate JSON IDs case-insensitively', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-intake-'));
    const jsonPath = path.join(directory, 'cases.json');
    const base = {
      module: 'Tagging',
      subModule: 'Advanced Filters',
      title: 'Title',
      steps: ['Step'],
      expectedResult: 'Expected',
    };
    await fs.writeFile(jsonPath, JSON.stringify({
      testCases: [
        { tcId: 'TC-TAG-ASSET-021', ...base },
        { tcId: 'tc-tag-asset-021', ...base },
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
