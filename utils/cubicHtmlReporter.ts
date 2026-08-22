/**
 * Cubic HTML Execution Report — custom Playwright reporter (skill 25).
 *
 * Generates a self-contained, stakeholder-readable HTML report after EVERY
 * run, branded for Cubic. For each failed test it shows: the failing step,
 * the error, where it failed (file:line), an F1–F5 classification with a
 * plain-language verdict (test implementation failure vs system bug), a
 * recommendation, and the failure screenshots embedded inline.
 *
 * Output:
 *   reports/cubic-report/index.html          — latest run (overwritten)
 *   reports/cubic-report/history/run-*.html  — timestamped copy per run
 *
 * Registered in playwright.config.ts — no manual step needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { classifyFailureMessage, stripAnsi, type FailureClassification } from './failureClassification';

interface ReportedTest {
  title: string;
  testId: string;
  file: string;
  line: number;
  project: string;
  outcome: 'passed' | 'failed' | 'flaky' | 'skipped';
  durationMs: number;
  retries: number;
  startTime: Date;
  errorMessage?: string;
  errorLocation?: string;
  failingStep?: string;
  classification?: FailureClassification;
  screenshots: { name: string; base64: string }[];
  videoPaths: string[];
  tracePaths: string[];
}

const MAX_EMBEDDED_IMAGE_BYTES = 3 * 1024 * 1024;

export default class CubicHtmlReporter implements Reporter {
  private tests: ReportedTest[] = [];
  private runStart = new Date();
  private configRootDir = process.cwd();
  private readonly companyName = process.env.REPORT_COMPANY_NAME ?? 'Cubic';
  private readonly outputDir = process.env.REPORT_OUTPUT_DIR ?? path.join('reports', 'cubic-report');

  printsToStdout(): boolean {
    return false;
  }

  onBegin(config: FullConfig, _suite: Suite): void {
    this.runStart = new Date();
    this.configRootDir = config.rootDir;
    this.tests = [];
  }

  onTestEnd(test: TestCase, _result: TestResult): void {
    // Aggregate on final result only; earlier retries are folded into the entry.
    const results = test.results;
    const lastResult = results[results.length - 1];
    if (!lastResult) return;

    const outcomeMap: Record<string, ReportedTest['outcome']> = {
      expected: 'passed',
      unexpected: 'failed',
      flaky: 'flaky',
      skipped: 'skipped',
    };
    const outcome = outcomeMap[test.outcome()] ?? 'failed';

    const entry: ReportedTest = {
      title: test.title,
      testId: extractTestCaseId(test.title),
      file: path.relative(this.configRootDir, test.location.file),
      line: test.location.line,
      project: test.parent.project()?.name ?? '',
      outcome,
      durationMs: results.reduce((total, r) => total + r.duration, 0),
      retries: results.length - 1,
      startTime: results[0]?.startTime ?? this.runStart,
      screenshots: [],
      videoPaths: [],
      tracePaths: [],
    };

    if (outcome === 'failed' || outcome === 'flaky') {
      const error = lastResult.errors[0] ?? lastResult.error;
      const rawMessage = error?.message ?? 'No error message captured.';
      entry.errorMessage = stripAnsi(rawMessage);
      const location = error && 'location' in error ? error.location : undefined;
      entry.errorLocation = location
        ? `${path.relative(this.configRootDir, location.file)}:${location.line}:${location.column}`
        : `${entry.file}:${entry.line}`;
      entry.failingStep = findFailingStep(lastResult.steps);
      entry.classification = classifyFailureMessage(entry.errorMessage);

      for (const attachment of lastResult.attachments) {
        if (!attachment.path && !attachment.body) continue;
        if (attachment.contentType === 'image/png') {
          const buffer = attachment.body ?? readIfSmall(attachment.path);
          if (buffer && buffer.byteLength <= MAX_EMBEDDED_IMAGE_BYTES) {
            entry.screenshots.push({ name: attachment.name, base64: buffer.toString('base64') });
          }
        } else if (attachment.contentType === 'video/webm' && attachment.path) {
          entry.videoPaths.push(path.relative(this.configRootDir, attachment.path));
        } else if (attachment.name === 'trace' && attachment.path) {
          entry.tracePaths.push(path.relative(this.configRootDir, attachment.path));
        }
      }
    }

    this.tests.push(entry);
  }

  async onEnd(_result: FullResult): Promise<void> {
    const runEnd = new Date();
    const html = renderHtml({
      companyName: this.companyName,
      projectName: process.env.PROJECT_NAME ?? 'ISCORE-ASSETS',
      targetEnv: process.env.TARGET_ENV ?? 'UAT',
      runStart: this.runStart,
      runEnd,
      tests: this.tests,
    });

    const indexPath = path.join(this.outputDir, 'index.html');
    const historyDir = path.join(this.outputDir, 'history');
    fs.mkdirSync(historyDir, { recursive: true });
    fs.writeFileSync(indexPath, html);
    const stamp = this.runStart.toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(historyDir, `run-${stamp}.html`), html);
    // eslint-disable-next-line no-console
    console.log(`\n${this.companyName} execution report: ${path.resolve(indexPath)}`);
  }
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function extractTestCaseId(title: string): string {
  const match = title.match(/^([A-Z]{2,}[A-Z0-9-]*-\d+)/i);
  return match ? match[1] : '—';
}

function readIfSmall(filePath: string | undefined): Buffer | undefined {
  if (!filePath || !fs.existsSync(filePath)) return undefined;
  try {
    if (fs.statSync(filePath).size > MAX_EMBEDDED_IMAGE_BYTES) return undefined;
    return fs.readFileSync(filePath);
  } catch {
    return undefined;
  }
}

/** Deepest step carrying an error → the human-readable "where it failed". */
function findFailingStep(steps: TestStep[]): string | undefined {
  for (const step of steps) {
    if (step.error) {
      const nested = findFailingStep(step.steps);
      return nested ? `${step.title} → ${nested}` : step.title;
    }
  }
  return undefined;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} m ${Math.round(seconds % 60)} s`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── HTML rendering ───────────────────────────────────────────────────────────

interface RenderInput {
  companyName: string;
  projectName: string;
  targetEnv: string;
  runStart: Date;
  runEnd: Date;
  tests: ReportedTest[];
}

const STATUS_META: Record<ReportedTest['outcome'], { label: string; color: string }> = {
  passed: { label: 'PASSED', color: '#1e8e3e' },
  failed: { label: 'FAILED', color: '#d93025' },
  flaky: { label: 'FLAKY', color: '#e37400' },
  skipped: { label: 'SKIPPED', color: '#5f6368' },
};

function renderHtml(input: RenderInput): string {
  const { tests } = input;
  const counts = {
    total: tests.length,
    passed: tests.filter((t) => t.outcome === 'passed').length,
    failed: tests.filter((t) => t.outcome === 'failed').length,
    flaky: tests.filter((t) => t.outcome === 'flaky').length,
    skipped: tests.filter((t) => t.outcome === 'skipped').length,
  };
  const executed = counts.total - counts.skipped;
  const passRate = executed > 0 ? Math.round(((counts.passed + counts.flaky) / executed) * 100) : 0;
  const wallDuration = input.runEnd.getTime() - input.runStart.getTime();

  const rows = tests
    .map((t, index) => {
      const meta = STATUS_META[t.outcome];
      const failBlock = t.outcome === 'failed' || t.outcome === 'flaky' ? renderFailureDetail(t) : '';
      return `
    <details class="test ${t.outcome}" ${t.outcome === 'failed' ? 'open' : ''}>
      <summary>
        <span class="badge" style="background:${meta.color}">${meta.label}</span>
        <span class="tcid">${escapeHtml(t.testId)}</span>
        <span class="title">${escapeHtml(t.title)}</span>
        <span class="meta">${escapeHtml(t.project)} · ${escapeHtml(t.file)}:${t.line} · ${formatDuration(t.durationMs)}${t.retries ? ` · ${t.retries} retr${t.retries === 1 ? 'y' : 'ies'}` : ''}</span>
      </summary>
      <div class="detail">
        <table class="kv">
          <tr><th>Started</th><td>${t.startTime.toLocaleString()}</td></tr>
          <tr><th>Duration</th><td>${formatDuration(t.durationMs)}</td></tr>
          <tr><th>Spec</th><td>${escapeHtml(t.file)}:${t.line}</td></tr>
        </table>
        ${failBlock}
      </div>
    </details>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(input.companyName)} — QA Execution Report</title>
<style>
  :root { --brand:#0b3a6f; --brand-2:#1266c2; --bg:#f4f6f9; --card:#ffffff; --ink:#202124; --muted:#5f6368; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif; background:var(--bg); color:var(--ink); }
  header { background:linear-gradient(120deg,var(--brand),var(--brand-2)); color:#fff; padding:28px 40px; }
  header .brand { font-size:30px; font-weight:700; letter-spacing:2px; }
  header .brand small { font-weight:300; letter-spacing:0; margin-left:12px; font-size:15px; opacity:.9; }
  header .runinfo { margin-top:8px; font-size:13px; opacity:.92; }
  main { padding:28px 40px; max-width:1200px; margin:0 auto; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:14px; margin-bottom:26px; }
  .tile { background:var(--card); border-radius:10px; padding:16px 18px; box-shadow:0 1px 3px rgba(0,0,0,.12); }
  .tile .num { font-size:30px; font-weight:700; }
  .tile .lbl { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-top:2px; }
  .tile.pass .num { color:#1e8e3e; } .tile.fail .num { color:#d93025; }
  .tile.flaky .num { color:#e37400; } .tile.skip .num { color:#5f6368; }
  .bar { height:10px; border-radius:5px; background:#e0e0e0; overflow:hidden; margin:4px 0 26px; }
  .bar div { height:100%; background:#1e8e3e; }
  h2 { font-size:17px; margin:22px 0 12px; }
  details.test { background:var(--card); border-radius:10px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,.12); overflow:hidden; }
  details.test summary { display:flex; flex-wrap:wrap; align-items:center; gap:10px; padding:13px 18px; cursor:pointer; list-style:none; }
  details.test summary::-webkit-details-marker { display:none; }
  .badge { color:#fff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:12px; letter-spacing:.5px; }
  .tcid { font-weight:700; color:var(--brand); white-space:nowrap; }
  .title { flex:1 1 300px; }
  .meta { font-size:12px; color:var(--muted); }
  .detail { border-top:1px solid #eceff3; padding:16px 18px; }
  table.kv { border-collapse:collapse; font-size:13px; margin-bottom:12px; }
  table.kv th { text-align:left; color:var(--muted); font-weight:600; padding:3px 14px 3px 0; vertical-align:top; }
  table.kv td { padding:3px 0; }
  .verdict { border-left:4px solid var(--brand-2); background:#eef4fb; padding:10px 14px; border-radius:0 8px 8px 0; margin:10px 0; font-size:14px; }
  .verdict b.f1,.verdict b.f3,.verdict b.f4,.verdict b.f5 { color:#b05a00; } .verdict b.f2 { color:#c5221f; }
  pre.err { background:#2d2d2d; color:#ffb4ab; font-size:12px; padding:12px 14px; border-radius:8px; overflow-x:auto; white-space:pre-wrap; }
  .shots { display:flex; flex-wrap:wrap; gap:12px; margin-top:10px; }
  .shots figure { margin:0; max-width:480px; }
  .shots img { max-width:100%; border:1px solid #d5dbe3; border-radius:8px; }
  .shots figcaption { font-size:11px; color:var(--muted); margin-top:4px; }
  footer { text-align:center; color:var(--muted); font-size:12px; padding:24px; }
  .filters { margin-bottom:14px; }
  .filters button { border:1px solid #c8d0da; background:#fff; border-radius:16px; padding:5px 14px; margin-right:8px; cursor:pointer; font-size:12px; }
  .filters button.active { background:var(--brand); color:#fff; border-color:var(--brand); }
</style>
</head>
<body>
<header>
  <div class="brand">${escapeHtml(input.companyName.toUpperCase())}<small>QA Automation — Execution Report</small></div>
  <div class="runinfo">
    Project: <b>${escapeHtml(input.projectName)}</b> · Environment: <b>${escapeHtml(input.targetEnv)}</b>
    · Started: ${input.runStart.toLocaleString()} · Finished: ${input.runEnd.toLocaleString()}
    · Total execution time: <b>${formatDuration(wallDuration)}</b>
  </div>
</header>
<main>
  <div class="tiles">
    <div class="tile"><div class="num">${counts.total}</div><div class="lbl">Total tests</div></div>
    <div class="tile pass"><div class="num">${counts.passed}</div><div class="lbl">Passed</div></div>
    <div class="tile fail"><div class="num">${counts.failed}</div><div class="lbl">Failed</div></div>
    <div class="tile flaky"><div class="num">${counts.flaky}</div><div class="lbl">Flaky</div></div>
    <div class="tile skip"><div class="num">${counts.skipped}</div><div class="lbl">Skipped</div></div>
    <div class="tile"><div class="num">${passRate}%</div><div class="lbl">Pass rate</div></div>
  </div>
  <div class="bar"><div style="width:${passRate}%"></div></div>
  <div class="filters">
    <button class="active" data-filter="all">All</button>
    <button data-filter="failed">Failed</button>
    <button data-filter="passed">Passed</button>
    <button data-filter="flaky">Flaky</button>
    <button data-filter="skipped">Skipped</button>
  </div>
  <h2>Executed tests</h2>
  ${rows || '<p>No tests were executed in this run.</p>'}
</main>
<footer>Generated by the ${escapeHtml(input.companyName)} QA Automation Framework · ${new Date().toLocaleString()}</footer>
<script>
  document.querySelectorAll('.filters button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filters button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.filter;
      document.querySelectorAll('details.test').forEach(function (el) {
        el.style.display = filter === 'all' || el.classList.contains(filter) ? '' : 'none';
      });
    });
  });
</script>
</body>
</html>`;
}

function renderFailureDetail(t: ReportedTest): string {
  const classification = t.classification;
  const verdict = classification
    ? `<div class="verdict">
         <b class="${classification.code.toLowerCase()}">${classification.code} — ${escapeHtml(classification.label)}</b><br>
         ${escapeHtml(classification.verdict)}<br>
         <b>Recommendation:</b> ${escapeHtml(classification.recommendation)}
       </div>`
    : '';

  const screenshots = t.screenshots.length
    ? `<div class="shots">${t.screenshots
        .map(
          (s) =>
            `<figure><img src="data:image/png;base64,${s.base64}" alt="${escapeHtml(s.name)}" loading="lazy"><figcaption>${escapeHtml(s.name)}</figcaption></figure>`
        )
        .join('')}</div>`
    : '<p style="font-size:12px;color:#5f6368">No screenshot captured for this failure.</p>';

  const evidenceLinks = [...t.videoPaths.map((v) => `Video: ${v}`), ...t.tracePaths.map((p) => `Trace: ${p}`)]
    .map((line) => `<div style="font-size:12px;color:#5f6368">${escapeHtml(line)}</div>`)
    .join('');

  return `
    <table class="kv">
      ${t.failingStep ? `<tr><th>Failed at step</th><td>${escapeHtml(t.failingStep)}</td></tr>` : ''}
      <tr><th>Failed at</th><td>${escapeHtml(t.errorLocation ?? '—')}</td></tr>
    </table>
    ${verdict}
    <pre class="err">${escapeHtml(t.errorMessage ?? '')}</pre>
    ${screenshots}
    ${evidenceLinks}`;
}
