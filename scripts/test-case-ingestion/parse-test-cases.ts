import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ExcelJS from 'exceljs';

export type TestCaseContract = {
  tcId: string;
  module: string;
  subModule: string;
  title: string;
  steps: string[];
  expectedResult: string;
  knownApiContracts: string[];
  knownTestData: Record<string, unknown>;
  knownNavigation: Record<string, unknown>;
  businessRules: string[];
  priority?: string;
  tags: string[];
};

export type IntakeResult = {
  source: string;
  testCases: Array<TestCaseContract & {
    readiness: 'Ready' | 'Needs contract clarification';
    gaps: string[];
  }>;
  approvalRequired: true;
};

const REQUIRED_FIELDS = [
  'tcId',
  'module',
  'subModule',
  'title',
  'steps',
  'expectedResult',
] as const;

const COLUMN_MAP: Record<string, keyof TestCaseContract> = {
  tcid: 'tcId',
  module: 'module',
  submodule: 'subModule',
  title: 'title',
  steps: 'steps',
  expectedresult: 'expectedResult',
  knownapiendpointfields: 'knownApiContracts',
  knowntestdata: 'knownTestData',
  knownrouteheading: 'knownNavigation',
  additionalbusinessrules: 'businessRules',
  priority: 'priority',
  suitetags: 'tags',
};

function canonicalColumn(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s_/-]+/g, '');
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in value) {
    return String((value as { text: unknown }).text ?? '').trim();
  }
  return String(value).trim();
}

function multiline(value: unknown): string[] {
  return text(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').trim())
    .filter(Boolean);
}

function jsonObject(value: unknown): Record<string, unknown> {
  const raw = text(value);
  if (!raw) return {};
  if (raw.startsWith('{')) {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error(`Expected a JSON object, received: ${raw}`);
    }
    return parsed as Record<string, unknown>;
  }
  return { description: raw };
}

function normalizeCase(input: Record<string, unknown>, position: number): TestCaseContract {
  const normalized: TestCaseContract = {
    tcId: text(input.tcId),
    module: text(input.module),
    subModule: text(input.subModule),
    title: text(input.title),
    steps: Array.isArray(input.steps)
      ? input.steps.map(text).filter(Boolean)
      : multiline(input.steps),
    expectedResult: text(input.expectedResult),
    knownApiContracts: Array.isArray(input.knownApiContracts)
      ? input.knownApiContracts.map(text).filter(Boolean)
      : multiline(input.knownApiContracts),
    knownTestData:
      input.knownTestData && typeof input.knownTestData === 'object' && !Array.isArray(input.knownTestData)
        ? input.knownTestData as Record<string, unknown>
        : jsonObject(input.knownTestData),
    knownNavigation:
      input.knownNavigation && typeof input.knownNavigation === 'object' && !Array.isArray(input.knownNavigation)
        ? input.knownNavigation as Record<string, unknown>
        : jsonObject(input.knownNavigation),
    businessRules: Array.isArray(input.businessRules)
      ? input.businessRules.map(text).filter(Boolean)
      : multiline(input.businessRules),
    priority: text(input.priority) || undefined,
    tags: Array.isArray(input.tags)
      ? input.tags.map(text).filter(Boolean)
      : text(input.tags).split(/[,;\r\n]+/).map((tag) => tag.trim()).filter(Boolean),
  };

  for (const field of REQUIRED_FIELDS) {
    const value = normalized[field];
    if ((Array.isArray(value) && value.length === 0) || (!Array.isArray(value) && !value)) {
      throw new Error(`Test case row ${position} is missing mandatory field: ${field}`);
    }
  }

  return normalized;
}

function readiness(testCase: TestCaseContract): string[] {
  const searchable = [
    testCase.title,
    testCase.expectedResult,
    ...testCase.steps,
    ...testCase.businessRules,
  ].join(' ').toLowerCase();
  const gaps: string[] = [];

  if (/\bapi\b|endpoint|response|request/.test(searchable) && testCase.knownApiContracts.length === 0) {
    gaps.push('API contract');
  }
  if (/navigate|route|heading|page/.test(searchable) && Object.keys(testCase.knownNavigation).length === 0) {
    gaps.push('navigation contract');
  }
  if (/select|click|display|visible|field|control|dialog|table|list/.test(searchable)
    && !testCase.businessRules.some((rule) => /ui|locator|role|heading|selector|dialog|table|list/i.test(rule))) {
    gaps.push('UI contract');
  }
  if (/account|customer|transaction|beneficiary|payer|card|loan/.test(searchable)
    && Object.keys(testCase.knownTestData).length === 0) {
    gaps.push('test-data contract');
  }
  if (/amount|currency|date|time|format|normalize|decimal/.test(searchable)
    && !testCase.businessRules.some((rule) => /format|locale|timezone|decimal|normaliz/i.test(rule))) {
    gaps.push('formatting/normalization contract');
  }
  if (/when|if |optional|conditional|null|empty|applicable/.test(searchable)
    && !testCase.businessRules.some((rule) => /when|if |optional|conditional|null|empty|applicable/i.test(rule))) {
    gaps.push('conditional/null behavior');
  }

  return gaps;
}

function validateDuplicates(testCases: TestCaseContract[]): void {
  const seen = new Map<string, string>();
  for (const testCase of testCases) {
    const key = testCase.tcId.trim().toLocaleLowerCase('en-US');
    const prior = seen.get(key);
    if (prior) {
      throw new Error(`Duplicate test-case ID: ${testCase.tcId} conflicts with ${prior}`);
    }
    seen.set(key, testCase.tcId);
  }
}

export async function parseJson(filePath: string): Promise<TestCaseContract[]> {
  const parsed: unknown = JSON.parse(await fs.readFile(filePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { testCases?: unknown }).testCases)) {
    throw new Error('JSON input must contain a non-empty testCases array');
  }
  const cases = (parsed as { testCases: unknown[] }).testCases;
  if (cases.length === 0) throw new Error('JSON input must contain a non-empty testCases array');
  return cases.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`testCases[${index}] must be an object`);
    }
    return normalizeCase(item as Record<string, unknown>, index + 1);
  });
}

export async function parseXlsx(filePath: string): Promise<TestCaseContract[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('XLSX input has no worksheets');

  const headers = new Map<number, keyof TestCaseContract>();
  worksheet.getRow(1).eachCell((cell, column) => {
    const mapped = COLUMN_MAP[canonicalColumn(cell.value)];
    if (mapped) headers.set(column, mapped);
  });

  for (const required of REQUIRED_FIELDS) {
    if (![...headers.values()].includes(required)) {
      throw new Error(`XLSX input is missing mandatory column: ${required}`);
    }
  }

  const cases: TestCaseContract[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const raw: Record<string, unknown> = {};
    for (const [column, field] of headers) raw[field] = row.getCell(column).value;
    if (!Object.values(raw).some((value) => text(value))) continue;
    cases.push(normalizeCase(raw, rowNumber));
  }
  if (cases.length === 0) throw new Error('XLSX input contains no test-case rows');
  return cases;
}

export async function ingestTestCases(filePath: string): Promise<IntakeResult> {
  const extension = path.extname(filePath).toLowerCase();
  const testCases = extension === '.json'
    ? await parseJson(filePath)
    : extension === '.xlsx'
      ? await parseXlsx(filePath)
      : (() => { throw new Error(`Unsupported test-case input: ${extension || '(no extension)'}`); })();

  validateDuplicates(testCases);
  return {
    source: path.resolve(filePath),
    testCases: testCases.map((testCase) => {
      const gaps = readiness(testCase);
      return {
        ...testCase,
        readiness: gaps.length === 0 ? 'Ready' : 'Needs contract clarification',
        gaps,
      };
    }),
    approvalRequired: true,
  };
}

async function main(): Promise<void> {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath) {
    throw new Error('Usage: parse-test-cases.ts <input.json|input.xlsx> [output.json]');
  }
  const result = await ingestTestCases(inputPath);
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) await fs.writeFile(outputPath, serialized, 'utf8');
  else process.stdout.write(serialized);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
