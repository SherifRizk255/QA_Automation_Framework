import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * One-off generator for the fillable test-case intake template consumed by
 * scripts/test-case-ingestion/parse-test-cases.ts (skill 13, reference
 * docs/ai-workflow/references/test-case-automation-intake.md).
 *
 * Columns match COLUMN_MAP in parse-test-cases.ts exactly. Re-run this
 * script only if that column set changes.
 */
async function main(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test Cases');

  sheet.columns = [
    { header: 'TC ID', key: 'tcId', width: 12 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Sub-module', key: 'subModule', width: 20 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Steps', key: 'steps', width: 50 },
    { header: 'Expected Result', key: 'expectedResult', width: 40 },
    { header: 'Known API endpoint/fields', key: 'knownApiContracts', width: 30 },
    { header: 'Known test data', key: 'knownTestData', width: 30 },
    { header: 'Known route/heading', key: 'knownNavigation', width: 30 },
    { header: 'Additional business rules', key: 'businessRules', width: 30 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Suite/tags', key: 'tags', width: 25 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  sheet.addRow({
    tcId: 'TC-ASSET-101',
    module: 'Asset Profile',
    subModule: 'Search',
    title: 'Search by asset tag returns exact match',
    steps:
      '1. Login as Asset User.\n' +
      '2. Navigate to Asset Profile > Search.\n' +
      '3. Enter a known asset tag in the search field.\n' +
      '4. Submit search.',
    expectedResult:
      'Result grid shows exactly one row matching the asset tag. Asset details panel is enabled.',
    knownApiContracts: 'GET /api/assets/search?tag=',
    knownTestData: '{"assetTag": "[ENV: TEST_ASSET_TAG]"}',
    knownNavigation: 'Route: /asset-profile/search | Heading: "Asset Search"',
    businessRules: 'Search is case-insensitive. Partial tag matches are excluded from exact-match mode.',
    priority: 'P1',
    tags: '@positive, @P1, @asset-profile, @smoke',
  });

  // Second blank row left for the user's next case, with helper comments.
  const helpRow = sheet.addRow({});
  helpRow.getCell('tcId').note = 'TC-<AREA>-<NNN>, e.g. TC-DISPOSAL-014';
  helpRow.getCell('steps').note = 'One numbered step per line — Enter for a new line within the cell.';
  helpRow.getCell('knownTestData').note = 'JSON object, or free text if no structured data applies.';
  helpRow.getCell('priority').note = 'P1 / P2 / P3 / P4';
  helpRow.getCell('tags').note =
    'Comma-separated tags (spaces alone will NOT split them) — see tagging taxonomy in docs/ai-workflow/12-tc-generator.md';

  const outPath = path.resolve(
    __dirname,
    '../../docs/ai-workflow/templates/test-case-intake-template.xlsx',
  );
  await workbook.xlsx.writeFile(outPath);
  console.log(`Template written: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
