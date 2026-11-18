#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const STUDENT_ID = process.env.STUDENT_ID || '23120285';
const PLAYWRIGHT_BIN = path.join(ROOT_DIR, 'node_modules', '.bin', 'playwright');
const TMP_JSON_DIR = path.join(ROOT_DIR, '.playwright-tmp', 'json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

const ALL_FEATURES = [
  { key: 'fr01', spec: 'tests/fr01-register.spec.ts', label: 'FR-01 Account Registration' },
  { key: 'fr02', spec: 'tests/fr02-login.spec.ts', label: 'FR-02 Login and Account Lockout' },
  { key: 'fr07', spec: 'tests/fr07-cart.spec.ts', label: 'FR-07 Shopping Cart' },
  { key: 'fr18', spec: 'tests/fr18-admin-orders.spec.ts', label: 'FR-18 Admin Order Management' },
];

const BROWSERS = ['chromium', 'firefox', 'webkit'];

/**
 * Check if a local TCP port is accepting connections (used to auto-detect Docker WebKit server).
 */
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Recursively collect leaf test specs and results from Playwright's JSON report tree.
 */
function collectJsonTestResults(suite, results = []) {
  for (const spec of suite.specs || []) {
    for (const testEntry of spec.tests || []) {
      const lastResult = testEntry.results?.[testEntry.results.length - 1];
      const status = lastResult?.status || testEntry.status || 'unknown';
      results.push({
        project: testEntry.projectName || 'unknown',
        title: spec.title,
        status,
        durationMs: lastResult?.duration ?? 0,
        errorMessage: lastResult?.error?.message?.split('\n')[0] || '',
      });
    }
  }
  for (const child of suite.suites || []) {
    collectJsonTestResults(child, results);
  }
  return results;
}

/**
 * Summarize a Playwright JSON report file into pass/fail/skip/flaky counts.
 */
function summarizeJsonReport(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Missing Playwright JSON report at ${jsonPath}`);
  }
  const report = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const stats = report.stats || {};
  const tests = (report.suites || []).flatMap((suite) => collectJsonTestResults(suite));
  const passed = stats.expected ?? tests.filter((t) => t.status === 'passed').length;
  const failed = stats.unexpected ?? tests.filter((t) => t.status !== 'passed' && t.status !== 'skipped').length;
  const skipped = stats.skipped ?? tests.filter((t) => t.status === 'skipped').length;
  const flaky = stats.flaky ?? 0;

  return {
    total: passed + failed + skipped + flaky,
    passed,
    failed,
    skipped,
    flaky,
    durationMs: Math.round(stats.duration || 0),
    tests,
  };
}

/**
 * Inject visible Student ID + ISO-8601 timestamp banner and <title> into Playwright's HTML report.
 */
function stampHtmlReport(reportDir, meta) {
  const indexPath = path.join(ROOT_DIR, reportDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing HTML report at ${indexPath}`);
  }
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Remove any previous stamp if overwriting isn't clean
  html = html.replace(/<div id=['"]hw04-run-stamp['"][\s\S]*?<\/div>\s*/i, '');

  const titleText = `HW04 Report — Run by: ${meta.studentId} | ${meta.featureLabel} | ${meta.browserLabel} (${meta.timestamp})`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(titleText)}</title>`);

  const bannerHtml = [
    `<div id="hw04-run-stamp" style="background:#0f172a;color:#f8fafc;padding:10px 20px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;border-bottom:2px solid #3b82f6;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;">`,
    `<span><strong>Run by: ${escapeHtml(meta.studentId)}</strong> &nbsp;|&nbsp; <strong>Timestamp:</strong> ${escapeHtml(meta.timestamp)} &nbsp;|&nbsp; <strong>Feature:</strong> ${escapeHtml(meta.featureLabel)} &nbsp;|&nbsp; <strong>Browser:</strong> ${escapeHtml(meta.browserLabel)}</span>`,
    `<span><strong>Results:</strong> ${meta.summary.passed} passed / ${meta.summary.failed} failed / ${meta.summary.total} total (${(meta.summary.durationMs / 1000).toFixed(1)}s)</span>`,
    `</div>`,
  ].join('');

  if (html.includes('<body>')) {
    html = html.replace('<body>', `<body>\n    ${bannerHtml}`);
  } else {
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n    ${bannerHtml}`);
  }

  fs.writeFileSync(indexPath, html, 'utf-8');
}

function executePlaywrightRun({ runKey, specArgs, projectArgs, featureLabel, browserLabel, reportDir, webkitWsEndpoint }) {
  const timestamp = new Date().toISOString();
  const jsonFile = path.join(TMP_JSON_DIR, `${runKey}.json`);
  const fullReportDir = path.join(ROOT_DIR, reportDir);

  fs.rmSync(fullReportDir, { recursive: true, force: true });
  fs.rmSync(jsonFile, { force: true });

  const args = ['test', ...specArgs, ...projectArgs];
  console.log(`\n▶ [${runKey}] Running: playwright ${args.join(' ')}`);

  const env = {
    ...process.env,
    STUDENT_ID: STUDENT_ID,
    RUN_TIMESTAMP: timestamp,
    REPORT_DIR: reportDir,
    REPORT_FEATURE: featureLabel,
    REPORT_BROWSER: browserLabel,
    JSON_REPORT_FILE: jsonFile,
  };
  if (webkitWsEndpoint) {
    env.WEBKIT_WS_ENDPOINT = webkitWsEndpoint;
  }

  const proc = spawnSync(PLAYWRIGHT_BIN, args, {
    cwd: ROOT_DIR,
    env,
    stdio: 'inherit',
  });

  const summary = summarizeJsonReport(jsonFile);
  stampHtmlReport(reportDir, {
    studentId: STUDENT_ID,
    timestamp,
    featureLabel,
    browserLabel,
    summary,
  });

  console.log(
    `✔ [${runKey}] exit=${proc.status} | passed=${summary.passed}, failed=${summary.failed}, total=${summary.total} -> ${reportDir}/index.html`,
  );

  return {
    runKey,
    featureLabel,
    browserLabel,
    reportDir,
    timestamp,
    exitCode: proc.status ?? -1,
    ...summary,
  };
}

function writeMasterReportsIndex(runs, combined) {
  const rowsHtml = runs
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.featureLabel)}</td>
        <td><code>${escapeHtml(r.browserLabel)}</code></td>
        <td>${r.total}</td>
        <td style="color:#15803d;font-weight:600">${r.passed}</td>
        <td style="color:#b91c1c;font-weight:600">${r.failed}</td>
        <td>${(r.durationMs / 1000).toFixed(1)}s</td>
        <td><code>${escapeHtml(r.timestamp)}</code></td>
        <td><a href="./${escapeHtml(path.basename(r.reportDir))}/index.html">Open Report</a></td>
      </tr>`,
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HW04 Multi-Browser Matrix Dashboard — Run by: ${escapeHtml(STUDENT_ID)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #0f172a; }
    .banner { background: #0f172a; color: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #3b82f6; }
    table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    th, td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 600; }
    .card { margin-top: 20px; padding: 16px; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  </style>
</head>
<body>
  <div class="banner">
    <h1 style="margin:0 0 6px 0;font-size:20px;">HW04 Multi-Browser Automation Matrix</h1>
    <div><strong>Run by: ${escapeHtml(STUDENT_ID)}</strong> &nbsp;|&nbsp; <strong>Matrix Generated:</strong> ${escapeHtml(combined.timestamp)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>Browser</th>
        <th>Total</th>
        <th>Passed</th>
        <th>Failed (SUT Bugs)</th>
        <th>Duration</th>
        <th>ISO-8601 Timestamp</th>
        <th>HTML Report</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="card">
    <strong>Combined All-Browsers Report:</strong>
    ${combined.passed} passed / ${combined.failed} failed / ${combined.total} total (${(combined.durationMs / 1000).toFixed(1)}s)
    &nbsp;—&nbsp; <a href="./all-browsers/index.html"><strong>Open Combined Multi-Browser Report</strong></a>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'index.html'), html, 'utf-8');
}

async function main() {
  fs.mkdirSync(TMP_JSON_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  let webkitWsEndpoint = process.env.WEBKIT_WS_ENDPOINT || '';
  if (!webkitWsEndpoint && (await isPortOpen('127.0.0.1', 9321))) {
    webkitWsEndpoint = 'ws://127.0.0.1:9321/';
    console.log(`ℹ Detected local Playwright WebKit server at ${webkitWsEndpoint}`);
  }

  const featureArg =
    process.argv.find((a) => a.startsWith('--feature='))?.split('=')[1] ||
    process.env.FEATURE ||
    '';
  const targetFeatures = featureArg
    ? ALL_FEATURES.filter((f) => f.key === featureArg)
    : ALL_FEATURES.filter((f) => ['fr01', 'fr07', 'fr18'].includes(f.key));

  if (targetFeatures.length === 0) {
    console.error(`❌ Feature '${featureArg}' not found in registered features.`);
    process.exit(1);
  }

  const individualRuns = [];
  for (const feature of targetFeatures) {
    for (const browser of BROWSERS) {
      const runKey = `${feature.key}-${browser}`;
      const result = executePlaywrightRun({
        runKey,
        specArgs: [feature.spec],
        projectArgs: [`--project=${browser}`],
        featureLabel: feature.label,
        browserLabel: browser,
        reportDir: `reports/${runKey}`,
        webkitWsEndpoint: browser === 'webkit' ? webkitWsEndpoint : '',
      });
      individualRuns.push(result);
    }
  }

  const combinedRunKey = featureArg ? `${featureArg}-all-browsers` : 'all-browsers';
  const combinedSpecArgs = featureArg ? [targetFeatures[0].spec] : [];
  const combinedFeatureLabel = featureArg
    ? `${targetFeatures[0].label} (All Browsers)`
    : 'All Features (FR-01, FR-07, FR-18)';

  const combined = executePlaywrightRun({
    runKey: combinedRunKey,
    specArgs: combinedSpecArgs,
    projectArgs: ['--project=chromium', '--project=firefox', '--project=webkit'],
    featureLabel: combinedFeatureLabel,
    browserLabel: 'chromium, firefox, webkit',
    reportDir: `reports/${combinedRunKey}`,
    webkitWsEndpoint,
  });

  if (!featureArg) {
    const matrixSummary = {
      studentId: STUDENT_ID,
      runBy: `Run by: ${STUDENT_ID}`,
      generatedAt: new Date().toISOString(),
      individualRuns,
      combinedRun: combined,
    };

    fs.writeFileSync(
      path.join(REPORTS_DIR, 'matrix-summary.json'),
      JSON.stringify(matrixSummary, null, 2),
      'utf-8',
    );
    writeMasterReportsIndex(individualRuns, combined);

    console.log('\n✅ Completed 9 individual runs + 1 combined multi-browser run.');
    console.log(`📄 Summary saved to reports/matrix-summary.json & reports/index.html`);
  } else {
    console.log(`\n✅ Completed 3 individual browser runs + 1 combined multi-browser run for ${targetFeatures[0].label}.`);
    console.log(`📄 Reports available under reports/${featureArg}-chromium, reports/${featureArg}-firefox, reports/${featureArg}-webkit, and reports/${combinedRunKey}`);
  }
}

main().catch((err) => {
  console.error('❌ Matrix execution failed:', err);
  process.exit(1);
});
