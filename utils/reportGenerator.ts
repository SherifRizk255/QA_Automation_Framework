import fs from 'node:fs';
import path from 'node:path';
import { classifyFailureMessage, stripAnsi } from './failureClassification.ts';

interface Attachment {
  name?: string;
  path?: string;
  contentType?: string;
}

interface TestResult {
  duration?: number;
  errors?: { message?: string }[];
  error?: { message?: string };
  attachments?: Attachment[];
}

interface TestEntry {
  status: string;
  results: TestResult[];
}

interface Spec {
  title: string;
  tests: TestEntry[];
}

interface Suite {
  specs?: Spec[];
  suites?: Suite[];
}

interface PlaywrightJsonResult extends Suite {}

interface TestSummaryEntry {
  title: string;
  status: string;
  duration: number;
  error?: { message?: string };
  attachments: Attachment[];
}

interface Summary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: TestSummaryEntry[];
}

interface CollectedAttachments {
  screenshots: string[];
  videos: string[];
  traces: string[];
}

const resultsDir = path.resolve('test-results');
const reportPath = path.resolve('reports', 'execution-summary.md');

function findFiles(dir: string, predicate: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? findFiles(fullPath, predicate) : predicate(fullPath) ? [fullPath] : [];
  });
}

function extractJsonResults(): PlaywrightJsonResult[] {
  const jsonFiles = findFiles(resultsDir, (filePath) => filePath.endsWith('.json'));
  return jsonFiles.flatMap((filePath) => {
    try {
      return [JSON.parse(fs.readFileSync(filePath, 'utf8')) as PlaywrightJsonResult];
    } catch {
      return [];
    }
  });
}

function collectAttachments(): CollectedAttachments {
  const files = findFiles(resultsDir, () => true);
  return {
    screenshots: files.filter((filePath) => filePath.endsWith('.png')),
    videos: files.filter((filePath) => filePath.endsWith('.webm')),
    traces: files.filter((filePath) => filePath.endsWith('.zip')),
  };
}

function flattenSpecs(suite: Suite | undefined, specs: Spec[] = []): Spec[] {
  if (!suite) {
    return specs;
  }

  for (const spec of suite.specs ?? []) {
    specs.push(spec);
  }

  for (const childSuite of suite.suites ?? []) {
    flattenSpecs(childSuite, specs);
  }

  return specs;
}

function summarizeFromJson(results: PlaywrightJsonResult[]): Summary {
  const specs = results.flatMap((result) => flattenSpecs(result));
  const tests: TestSummaryEntry[] = specs.flatMap((spec) =>
    spec.tests.map((test) => ({
      title: spec.title,
      status: test.status,
      duration: test.results.reduce((total, run) => total + (run.duration ?? 0), 0),
      error: test.results.flatMap((run) => run.errors ?? (run.error ? [run.error] : [])).at(0),
      attachments: test.results.flatMap((run) => run.attachments ?? []),
    }))
  );

  return {
    total: tests.length,
    passed: tests.filter((test) => test.status === 'expected').length,
    failed: tests.filter((test) => test.status === 'unexpected').length,
    skipped: tests.filter((test) => test.status === 'skipped').length,
    duration: tests.reduce((total, test) => total + test.duration, 0),
    failures: tests.filter((test) => test.status === 'unexpected'),
  };
}

function writeMarkdown(summary: Summary, attachments: CollectedAttachments): void {
  const lines = [
    '# Execution Summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Total test cases run: ${summary.total}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Skipped: ${summary.skipped}`,
    `- Execution duration: ${(summary.duration / 1000).toFixed(2)} seconds`,
    '',
    '## Failed Tests',
    '',
  ];

  if (summary.failures.length === 0) {
    lines.push('No failed tests found in the available Playwright JSON result files.');
  } else {
    for (const failure of summary.failures) {
      const message = stripAnsi(failure.error?.message ?? 'No error message captured.');
      const screenshot =
        failure.attachments.find((item) => item.contentType === 'image/png' && /failure|test-failed/i.test(item.name ?? item.path ?? ''))?.path ??
        failure.attachments.find((item) => item.contentType === 'image/png' && /transfer-screen-opened/i.test(item.name ?? item.path ?? ''))?.path ??
        failure.attachments.find((item) => item.contentType === 'image/png')?.path ??
        attachments.screenshots.at(0) ??
        'Not available';
      const video = failure.attachments.find((item) => item.contentType === 'video/webm')?.path ?? attachments.videos.at(0) ?? 'Not available';
      const trace = failure.attachments.find((item) => item.name === 'trace')?.path ?? attachments.traces.at(0) ?? 'Not available';

      lines.push(`### ${failure.title}`);
      lines.push('');
      lines.push(`- Failed step or error message: ${message.split('\n').at(0)}`);
      lines.push(`- Screenshot path: ${screenshot}`);
      lines.push(`- Video path: ${video}`);
      lines.push(`- Trace path: ${trace}`);
      const classification = classifyFailureMessage(message);
      lines.push(`- Failure classification: ${classification.code} — ${classification.label}`);
      lines.push(`- Verdict: ${classification.verdict}`);
      lines.push(`- Recommendation: ${classification.recommendation}`);
      lines.push('');
    }
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  while (lines.at(-1) === '') {
    lines.pop();
  }
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
}

const results = extractJsonResults();
const attachments = collectAttachments();
const summary = results.length
  ? summarizeFromJson(results)
  : {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: [],
    };

writeMarkdown(summary, attachments);
console.log(`Execution summary generated: ${reportPath}`);
