/**
 * QA Execution Report Generator
 * Reads test-results/results.json (Playwright JSON reporter output) and generates:
 *   reports/execution-summary.md
 *   reports/execution-summary.html
 *   reports/forgot-password-negative-execution-summary.md  (if those tests are in results)
 *   reports/forgot-password-negative-execution-summary.html
 *
 * Run: node utils/reportGenerator.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '..');
const RESULTS    = path.join(ROOT, 'test-results', 'results.json');
const REPORTS    = path.join(ROOT, 'reports');

// ── Sensitive data masking ────────────────────────────────────────────────
const MASKS = [
  { re: /\b\d{14}\b/g,                        sub: '[NATIONAL-ID-MASKED]' },
  { re: /(otp[:\s=]+)\d{4,8}/gi,              sub: '$1[OTP-MASKED]'       },
  { re: /(password[:\s=]+)\S+/gi,             sub: '$1[PASSWORD-MASKED]'  },
  { re: /(P2ssw0rd|Test@\d{4})\S*/g,          sub: '[PASSWORD-MASKED]'    },
];

function mask(text) {
  if (!text || typeof text !== 'string') return text ?? '';
  for (const { re, sub } of MASKS) text = text.replace(re, sub);
  return text;
}

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripAnsi(s) {
  return String(s ?? '').replace(/\[[0-9;]*m/g, '');
}

// ── Failure classification ────────────────────────────────────────────────
function classify(msg) {
  const t = String(msg ?? '').toLowerCase();
  if (/active session blocker/i.test(t))                                         return 'Known business blocker';
  if (/otp cooldown|error occurred while sending the otp/i.test(t))              return 'Known business blocker';
  if (/crm credentials not configured|crm_username|crm_password/i.test(t))      return 'Environment issue';
  if (/net::|err_|timeout.*exceeded|dns|connection refused|navigation timeout/i.test(t)) return 'Environment issue';
  if (/transfer between my accounts|from account dropdown/i.test(t))            return 'Application defect';
  if (/portal_username|portal_password|invalid user|unauthorized/i.test(t))     return 'Test data issue';
  if (/locator|strict mode|not found.*locator|getByRole|getByPlaceholder/i.test(t)) return 'Automation script issue';
  if (/expected.*to have url|tobe.*url/i.test(t))                               return 'Automation script issue';
  return 'Requirement ambiguity';
}

function recommend(cls, msg) {
  if (cls === 'Application defect') {
    if (/transfer between my accounts/i.test(msg)) {
      return 'Validate the Between My Accounts card action and ensure the From/To Account form renders for the authenticated retail customer.';
    }
    return 'Raise an application defect ticket. Attach the screenshot, video, and trace as evidence.';
  }
  if (cls === 'Automation script issue')  return 'Inspect the live page locator with Playwright codegen or headed mode; update the Page Object with a stable accessible selector.';
  if (cls === 'Test data issue')          return 'Verify .env credentials are correct and the test account has required data (eligibility, balance, etc.).';
  if (cls === 'Environment issue')        return 'Check portal availability, HTTPS certificate, network connectivity, and test environment health. Retry after the environment is stable.';
  if (cls === 'Known business blocker')   return 'Expected application behavior. Re-run after the business constraint clears (e.g., OTP cooldown expired, active session closed).';
  return 'Clarify expected behavior with the business analyst or check the requirements documentation.';
}

// ── JSON parsing helpers ───────────────────────────────────────────────────
function flattenSpecs(suite, out = []) {
  for (const s of suite.specs  ?? []) out.push(s);
  for (const c of suite.suites ?? []) flattenSpecs(c, out);
  return out;
}

function buildRecords(suites, fileFilter = null) {
  return suites
    .filter(s => !fileFilter || (s.file ?? s.title ?? '').includes(fileFilter))
    .flatMap(suite => flattenSpecs(suite).flatMap(spec =>
      (spec.tests ?? []).map(test => {
        const runs     = test.results ?? [];
        const firstErr = runs.flatMap(r => r.errors ?? []).at(0);
        return {
          title:       spec.title,
          suiteTitle:  suite.title,
          status:      test.status,            // expected | unexpected | skipped
          annotations: [
            ...(test.annotations ?? []),
            ...runs.flatMap(r => r.annotations ?? []),
          ],
          duration:    runs.reduce((s, r) => s + (r.duration ?? 0), 0),
          error:       firstErr ? stripAnsi(firstErr.message ?? '') : null,
          attachments: runs.flatMap(r => r.attachments ?? []),
        };
      })
    ));
}

function summarise(records, wallClockMs) {
  return {
    total:    records.length,
    passed:   records.filter(r => r.status === 'expected').length,
    failed:   records.filter(r => r.status === 'unexpected').length,
    skipped:  records.filter(r => r.status === 'skipped').length,
    duration: wallClockMs ?? records.reduce((s, r) => s + r.duration, 0),
    failures: records.filter(r => r.status === 'unexpected'),
    records,
  };
}

function getEvidence(attachments) {
  const att = a => attachments.find(a);
  const png  = contentType => a => a.contentType === contentType;
  const name = re => a => re.test(a.name ?? a.path ?? '');

  const screenshot =
    attachments.find(a => a.contentType === 'image/png' && /failure|test-failed/i.test(a.name ?? a.path ?? ''))?.path ??
    attachments.find(a => a.contentType === 'image/png')?.path ??
    null;
  const video =
    attachments.find(a => a.contentType === 'video/webm')?.path ?? null;
  const trace =
    attachments.find(a => a.name === 'trace' || a.path?.endsWith('.zip'))?.path ?? null;

  return { screenshot, video, trace };
}

// ── Markdown generator ────────────────────────────────────────────────────
function genMd(sum, featureName = '') {
  const title = featureName ? `${featureName} — Execution Summary` : 'Execution Summary';
  const dur   = (sum.duration / 1000).toFixed(2);
  const ts    = new Date().toISOString();

  const lines = [
    `# ${title}`,
    '',
    `Generated: ${ts}`,
    ...(featureName ? [`Feature: ${featureName}`, ''] : ['']),
    `- Total test cases run: ${sum.total}`,
    `- Passed: ${sum.passed}`,
    `- Failed: ${sum.failed}`,
    `- Skipped: ${sum.skipped}`,
    `- Execution duration: ${dur} seconds`,
    '',
    '## Failed Tests',
    '',
  ];

  if (sum.failures.length === 0) {
    lines.push('No failed tests. All tests passed.');
  } else {
    for (const f of sum.failures) {
      const msg = mask(f.error ?? 'No error message captured.');
      const { screenshot, video, trace } = getEvidence(f.attachments);
      const cls = classify(msg);
      lines.push(
        `### ${f.title}`, '',
        `- Failed step or error message: ${msg.split('\n').at(0)}`,
        `- Screenshot path: ${screenshot ?? 'Not available'}`,
        `- Video path: ${video ?? 'Not available'}`,
        `- Trace path: ${trace ?? 'Not available'}`,
        `- Failure classification: ${cls}`,
        `- Recommendation: ${recommend(cls, msg)}`,
        '',
      );
    }
  }

  return lines.join('\n') + '\n';
}

// ── HTML generator ─────────────────────────────────────────────────────────
function badge(status) {
  if (status === 'expected') return '<span class="badge pass">PASSED</span>';
  if (status === 'unexpected') return '<span class="badge fail">FAILED</span>';
  if (status === 'skipped') return '<span class="badge skip">SKIPPED</span>';
  return `<span class="badge">${esc(status)}</span>`;
}

function genHtml(sum, pageTitle = 'QA Execution Report', featureName = '') {
  const dur      = (sum.duration / 1000).toFixed(1);
  const passRate = sum.total > 0 ? Math.round((sum.passed / sum.total) * 100) : 0;
  const ts       = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'medium' });
  const iso      = new Date().toISOString();
  const overall  = sum.failed > 0 ? 'FAILED' : (sum.total === sum.passed ? 'ALL PASSED' : 'PARTIAL');
  const hdrColor = sum.failed > 0 ? '#7f1d1d' : '#14532d';
  const pillBg   = sum.failed > 0 ? '#fca5a5' : '#86efac';
  const pillFg   = sum.failed > 0 ? '#7f1d1d' : '#14532d';

  /* ── Test table rows ── */
  const rows = sum.records.map((r, i) => {
    const note = r.annotations.find(a => a.type === 'pass' || a.type === 'fail' || a.type === 'info')?.description ?? '';
    return `<tr>
      <td class="idx">${i + 1}</td>
      <td class="tname">${esc(r.title)}</td>
      <td>${badge(r.status)}</td>
      <td class="dur">${(r.duration / 1000).toFixed(1)}s</td>
      <td class="note">${esc(mask(note))}</td>
    </tr>`;
  }).join('\n');

  /* ── Failure cards ── */
  const failCards = sum.failures.length === 0
    ? `<div class="ok-banner">✅ All tests passed — no failures to report.</div>`
    : sum.failures.map(f => {
        const msg   = mask(f.error ?? 'No error message captured.');
        const short = esc(msg.split('\n').at(0) ?? '').slice(0, 200);
        const full  = esc(msg.slice(0, 2000) + (msg.length > 2000 ? '\n…' : ''));
        const { screenshot, video, trace } = getEvidence(f.attachments);
        const cls   = classify(msg);
        const rec   = recommend(cls, msg);

        const evCol = (label, val) =>
          `<div class="ev-col">
             <div class="ev-label">${label}</div>
             <div class="ev-val">${val ? `<span class="ev-path" title="${esc(val)}">${esc(path.basename(val))}</span>` : '<span class="na">—</span>'}</div>
           </div>`;

        return `<div class="fail-card">
          <div class="fail-title">❌ ${esc(f.title)}</div>
          <div class="fail-meta"><span class="cls-pill">${esc(cls)}</span></div>
          <div class="fail-section">
            <div class="fail-lbl">Error / Failed Step</div>
            <div class="err-box">${full}</div>
          </div>
          <div class="ev-row">
            ${evCol('Screenshot', screenshot)}
            ${evCol('Video', video)}
            ${evCol('Trace', trace)}
          </div>
          <div class="fail-section">
            <div class="fail-lbl">Recommendation</div>
            <div class="reco">${esc(rec)}</div>
          </div>
        </div>`;
      }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(pageTitle)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}

/* Header */
.ph{background:${hdrColor};color:#f8fafc;padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem}
.ph h1{font-size:1.2rem;font-weight:800;letter-spacing:-.02em}
.ph .sub{font-size:.72rem;color:#94a3b8;margin-top:.2rem}
.pill{padding:.3rem .9rem;border-radius:9999px;font-size:.75rem;font-weight:800;background:${pillBg};color:${pillFg};letter-spacing:.04em}

/* Layout */
.wrap{max-width:1160px;margin:0 auto;padding:1.5rem 1.5rem 3rem}

/* Metric cards */
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.875rem;margin-bottom:1.75rem}
.mc{background:#fff;border-radius:.625rem;padding:1.125rem 1rem;box-shadow:0 1px 3px rgba(0,0,0,.08);text-align:center}
.mc .n{font-size:2.1rem;font-weight:800;line-height:1}
.mc .l{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-top:.3rem}
.mc.tot .n{color:#3b82f6}
.mc.pas .n{color:#22c55e}
.mc.fai .n{color:#ef4444}
.mc.ski .n{color:#f59e0b}
.mc.dur .n{font-size:1.4rem;color:#8b5cf6}
.mc.rat .n{font-size:1.4rem;color:#06b6d4}

/* Section card */
.sc{background:#fff;border-radius:.625rem;box-shadow:0 1px 3px rgba(0,0,0,.08);margin-bottom:1.75rem;overflow:hidden}
.sc-head{padding:.875rem 1.5rem;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:.875rem;color:#374151;display:flex;align-items:center;gap:.5rem}

/* Table */
table{width:100%;border-collapse:collapse}
thead th{padding:.625rem 1rem;text-align:left;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;background:#f8fafc;border-bottom:2px solid #e2e8f0;white-space:nowrap}
tbody td{padding:.7rem 1rem;border-bottom:1px solid #f1f5f9;font-size:.8rem;vertical-align:middle}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#f8fafc}
td.idx{color:#94a3b8;font-size:.7rem;width:36px}
td.tname{font-weight:500;max-width:360px;word-break:break-word}
td.dur{color:#6b7280;font-size:.75rem;white-space:nowrap}
td.note{color:#4b5563;font-size:.72rem;max-width:280px}

/* Badges */
.badge{display:inline-block;padding:.18rem .55rem;border-radius:9999px;font-size:.65rem;font-weight:800;letter-spacing:.03em;white-space:nowrap}
.badge.pass{background:#dcfce7;color:#15803d}
.badge.fail{background:#fee2e2;color:#b91c1c}
.badge.skip{background:#fef3c7;color:#b45309}

/* Failure cards */
.fails-body{padding:1rem 1.25rem}
.ok-banner{padding:2rem;text-align:center;color:#15803d;font-weight:700;font-size:.875rem;background:#f0fdf4;border-radius:.375rem}
.fail-card{border:1px solid #fca5a5;border-radius:.5rem;margin-bottom:1.25rem;overflow:hidden}
.fail-card:last-child{margin-bottom:0}
.fail-title{background:#fff1f2;padding:.7rem 1rem;font-weight:700;font-size:.825rem;color:#be123c;border-bottom:1px solid #fecdd3}
.fail-meta{padding:.4rem 1rem;background:#fff;border-bottom:1px solid #fee2e2}
.cls-pill{display:inline-block;padding:.175rem .5rem;border-radius:.25rem;font-size:.65rem;font-weight:800;background:#dbeafe;color:#1d4ed8}
.fail-section{padding:.7rem 1rem;border-bottom:1px solid #fee2e2}
.fail-section:last-child{border-bottom:none}
.fail-lbl{font-size:.6rem;font-weight:800;text-transform:uppercase;color:#6b7280;letter-spacing:.06em;margin-bottom:.35rem}
.err-box{background:#0f172a;color:#e2e8f0;padding:.7rem;border-radius:.375rem;font-family:'Consolas','Courier New',monospace;font-size:.68rem;overflow-x:auto;white-space:pre-wrap;word-break:break-all;line-height:1.55;max-height:220px;overflow-y:auto}
.ev-row{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #fee2e2}
.ev-col{padding:.7rem 1rem;border-right:1px solid #fee2e2}
.ev-col:last-child{border-right:none}
.ev-label{font-size:.6rem;font-weight:800;text-transform:uppercase;color:#6b7280;letter-spacing:.06em;margin-bottom:.35rem}
.ev-val{font-size:.72rem;color:#4b5563;word-break:break-all}
.ev-path{color:#2563eb;font-family:monospace;font-size:.68rem}
.na{color:#9ca3af}
.reco{background:#eff6ff;border-left:3px solid #2563eb;padding:.55rem .8rem;border-radius:0 .25rem .25rem 0;font-size:.775rem;color:#1e40af;line-height:1.55}

/* Footer */
footer{text-align:center;padding:1.5rem;color:#94a3b8;font-size:.7rem;border-top:1px solid #e2e8f0;margin-top:1.5rem}
</style>
</head>
<body>

<div class="ph">
  <div>
    <h1>${esc(pageTitle)}</h1>
    <div class="sub">${featureName ? `Feature: <strong>${esc(featureName)}</strong> &nbsp;|&nbsp; ` : ''}Generated: ${esc(ts)}</div>
  </div>
  <span class="pill">${overall}</span>
</div>

<div class="wrap">

  <div class="metrics">
    <div class="mc tot"><div class="n">${sum.total}</div><div class="l">Total</div></div>
    <div class="mc pas"><div class="n">${sum.passed}</div><div class="l">Passed</div></div>
    <div class="mc fai"><div class="n">${sum.failed}</div><div class="l">Failed</div></div>
    <div class="mc ski"><div class="n">${sum.skipped}</div><div class="l">Skipped</div></div>
    <div class="mc dur"><div class="n">${dur}s</div><div class="l">Duration</div></div>
    <div class="mc rat"><div class="n">${passRate}%</div><div class="l">Pass Rate</div></div>
  </div>

  <div class="sc">
    <div class="sc-head">📋 Test Results</div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Test Case</th><th>Status</th><th>Duration</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="sc">
    <div class="sc-head">🔴 Failed Tests${sum.failures.length > 0 ? ` (${sum.failures.length})` : ''}</div>
    <div class="fails-body">${failCards}</div>
  </div>

</div>

<footer>
  <p>Generated by <strong>QA Automation Framework</strong> &nbsp;|&nbsp; Playwright TypeScript &nbsp;|&nbsp; ${esc(iso)}</p>
  <p style="margin-top:.25rem">⚠️ Sensitive data (passwords, OTPs, National IDs) is masked in this report.</p>
</footer>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────
function main() {
  fs.mkdirSync(REPORTS, { recursive: true });

  let data = null;

  if (fs.existsSync(RESULTS)) {
    try {
      data = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
    } catch (e) {
      console.error('[reportGenerator] Failed to parse results.json:', e.message);
    }
  } else {
    console.warn('[reportGenerator] WARNING: test-results/results.json not found.');
    console.warn('[reportGenerator] Run tests without --reporter override to produce results.json.');
  }

  const stats  = data?.stats  ?? {};
  const suites = data?.suites ?? [];

  // ── Global report ──
  const allRecords = buildRecords(suites);
  const global     = summarise(allRecords, stats.duration);

  const globalMd   = genMd(global);
  fs.writeFileSync(path.join(REPORTS, 'execution-summary.md'), globalMd);
  console.log('✅  reports/execution-summary.md');

  const globalHtml = genHtml(global, 'QA Execution Report');
  fs.writeFileSync(path.join(REPORTS, 'execution-summary.html'), globalHtml);
  console.log('✅  reports/execution-summary.html');

  // ── Forgot Password Negative (feature-specific) ──
  const fpNegRecords = buildRecords(suites, 'forgot-password-negative');
  if (fpNegRecords.length > 0) {
    const fpNegSum = summarise(fpNegRecords, fpNegRecords.reduce((s, r) => s + r.duration, 0));

    const fpNegMd = genMd(fpNegSum, 'Forgot Password Negative');
    fs.writeFileSync(path.join(REPORTS, 'forgot-password-negative-execution-summary.md'), fpNegMd);
    console.log('✅  reports/forgot-password-negative-execution-summary.md');

    const fpNegHtml = genHtml(fpNegSum, 'Forgot Password Negative — Execution Report', 'Forgot Password Negative Demo');
    fs.writeFileSync(path.join(REPORTS, 'forgot-password-negative-execution-summary.html'), fpNegHtml);
    console.log('✅  reports/forgot-password-negative-execution-summary.html');
  }

  console.log(`\n📊  Total: ${global.total}  |  Passed: ${global.passed}  |  Failed: ${global.failed}  |  Skipped: ${global.skipped}  |  Duration: ${(global.duration / 1000).toFixed(1)}s`);
}

main();
