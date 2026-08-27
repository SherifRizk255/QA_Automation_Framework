import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';

/**
 * Reusable, generic Excel reader for validating downloaded report exports —
 * not tied to any one report's column set. Reads the real workbook (headers,
 * rows, per-column values) so tests can assert actual exported DATA rather
 * than only "a file was downloaded" (see docs/analysis skill 25 / the
 * Reports module automation notes for why this matters).
 *
 * The Reports export's `xl/*.xml` parts use an `x:` namespace prefix on
 * every element (`<x:workbook>`, `<x:sheets>`, `<x:sheet>`, ...) — valid
 * OOXML, but ExcelJS's reader does not recognize prefixed elements and fails
 * with "Cannot read properties of undefined (reading 'sheets')" on the raw
 * file (verified live 2026-08-25, reproduced outside Playwright too, so this
 * is a real backend/library quirk, not a test-harness bug). `stripXmlNamespacePrefix`
 * normalizes every `xl/*.xml` part before handing the workbook to ExcelJS.
 */
export type ExcelWorkbookSnapshot = {
  worksheetNames: string[];
  headers: string[];
  rows: Record<string, string>[];
};

export async function readExcelWorkbook(filePath: string): Promise<ExcelWorkbookSnapshot> {
  const normalizedBuffer = await stripXmlNamespacePrefix(await readFile(filePath));
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- two conflicting Buffer type instantiations in node_modules
  await workbook.xlsx.load(normalizedBuffer as any);

  const worksheetNames = workbook.worksheets.map((sheet) => sheet.name);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return { worksheetNames, headers: [], rows: [] };
  }

  const headerRowNumber = findHeaderRowNumber(worksheet);

  if (!headerRowNumber) {
    return { worksheetNames, headers: [], rows: [] };
  }

  const headers: string[] = [];
  worksheet.getRow(headerRowNumber).eachCell({ includeEmpty: false }, (cell, column) => {
    headers[column - 1] = cellText(cell.value);
  });

  const rows: Record<string, string>[] = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record: Record<string, string> = {};
    let hasAnyValue = false;

    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellText(row.getCell(index + 1).value);
      record[header] = value;
      if (value) hasAnyValue = true;
    });

    if (hasAnyValue) {
      rows.push(record);
    }
  }

  return { worksheetNames, headers: headers.filter(Boolean), rows };
}

/** True when every row's value in `column` equals `expectedValue` (case-insensitive, trimmed). */
export function everyRowMatchesColumnValue(
  snapshot: ExcelWorkbookSnapshot,
  column: string,
  expectedValue: string
): boolean {
  if (snapshot.rows.length === 0) return false;
  const expected = expectedValue.trim().toLowerCase();
  return snapshot.rows.every((row) => (row[column] ?? '').trim().toLowerCase() === expected);
}

/** Distinct, non-empty values observed in `column` across every row. */
export function distinctColumnValues(snapshot: ExcelWorkbookSnapshot, column: string): string[] {
  const values = new Set<string>();
  for (const row of snapshot.rows) {
    const value = (row[column] ?? '').trim();
    if (value) values.add(value);
  }
  return [...values];
}

/**
 * Locates the real header row rather than assuming row 1. Verified live
 * 2026-08-25: this report's export leads with a 4-row title/metadata banner
 * ("Asset Register Report" / "Period: All" / "Generated: <timestamp>" /
 * "Total assets: N", each value repeated identically across every column via
 * merged cells) plus a blank spacer row, THEN the real header row. A banner
 * row is detected by having only one distinct non-empty value across its
 * cells; the header row is the first row with more than one distinct value.
 * Returns undefined if no such row exists within the first 20 rows (an
 * unexpectedly-shaped or empty export — callers treat that as "no headers").
 */
function findHeaderRowNumber(worksheet: ExcelJS.Worksheet): number | undefined {
  const scanLimit = Math.min(worksheet.rowCount, 20);

  for (let rowNumber = 1; rowNumber <= scanLimit; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      const text = cellText(cell.value);
      if (text) values.push(text);
    });

    if (values.length === 0) continue;

    const distinctValues = new Set(values);
    if (distinctValues.size > 1) {
      return rowNumber;
    }
  }

  return undefined;
}

/**
 * Rewrites every `<prefix:tag>`/`</prefix:tag>` to `<tag>`/`</tag>` in every
 * `.xml` zip entry, leaving everything else (binary parts) untouched. Not
 * hardcoded to one prefix — `xl/workbook.xml` uses `x:` here but
 * `docProps/app.xml` uses a DIFFERENT prefix (`ap:`) in the same file
 * (verified live 2026-08-25), so this strips whatever prefix each element
 * actually has. Only the element prefix is stripped — the now-unused
 * `xmlns:*="..."` attributes are left in place, which is harmless.
 */
async function stripXmlNamespacePrefix(fileBuffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const xmlEntries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.endsWith('.xml'));

  for (const entry of xmlEntries) {
    const xml = await entry.async('string');
    const normalized = xml.replace(/<(\/?)[A-Za-z0-9]+:/g, '<$1');
    zip.file(entry.name, normalized);
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in value) return String((value as { text: unknown }).text ?? '').trim();
  if (typeof value === 'object' && 'result' in value) return String((value as { result: unknown }).result ?? '').trim();
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}
