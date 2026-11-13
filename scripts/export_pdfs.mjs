#!/usr/bin/env node
/**
 * Render Markdown deliverables to styled A4 PDFs via Pandoc (GFM -> HTML5) and Playwright Chromium.
 * Preserves full Vietnamese Unicode glyphs, Markdown tables, code blocks, and embedded PNG screenshots.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT_DIR = process.cwd();

const GITHUB_CSS = `
  body {
    font-family: "Noto Sans", "Liberation Sans", "DejaVu Sans", system-ui, -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    color: #0f172a;
    max-width: 100%;
    margin: 0;
  }
  h1, h2, h3 {
    color: #1e3a8a;
    page-break-after: avoid;
    margin-top: 18px;
    margin-bottom: 8px;
  }
  h1 { font-size: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; }
  h2 { font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 14px; }
  p, li { margin: 6px 0; }
  table {
    width: 100%;
    table-layout: auto;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 10px;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 4px 5px;
    text-align: left;
    vertical-align: top;
    overflow-wrap: break-word;
    word-break: normal;
  }
  th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; }
  tr:nth-child(even) td { background-color: #f8fafc; }
  code {
    font-family: "DejaVu Sans Mono", "Liberation Mono", monospace;
    background: #f1f5f9;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11.5px;
  }
  pre {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 8px 10px;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 11px;
    page-break-inside: avoid;
  }
  pre code { background: transparent; padding: 0; }
  blockquote {
    margin: 10px 0;
    padding: 6px 12px;
    border-left: 4px solid #3b82f6;
    background: #eff6ff;
    color: #1e293b;
  }
  img {
    max-width: 100%;
    max-height: 320px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    margin: 6px 0;
    display: block;
    page-break-inside: avoid;
  }
`;

function renderMarkdownToHtmlFile(mdPath, tmpHtmlPath) {
  const mdDir = path.dirname(mdPath);
  const rawHtml = execFileSync(
    'pandoc',
    ['-f', 'gfm', '-t', 'html5', '--standalone', mdPath],
    { encoding: 'utf-8' },
  );

  // Rewrite relative src/href for local images cleanly so file:// Chromium loads them
  const baseUrl = pathToFileURL(mdDir + path.sep).href;
  const patchedHtml = rawHtml
    .replace('<head>', `<head>\n<base href="${baseUrl}">`)
    .replace('</head>', `<style>${GITHUB_CSS}</style>\n</head>`);

  fs.writeFileSync(tmpHtmlPath, patchedHtml, 'utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  const targets =
    args.length > 0
      ? args.map((md) => ({ md, pdf: md.replace(/\.md$/i, '.pdf') }))
      : [
          { md: 'AI_CRITIQUE.md', pdf: 'AI_CRITIQUE.pdf' },
          { md: 'report.md', pdf: 'report.pdf' },
          { md: 'docs/bug_report.md', pdf: 'docs/bug_report.pdf' },
          { md: 'README.md', pdf: 'README.pdf' },
        ];

  const tmpDir = path.join(ROOT_DIR, '.playwright-tmp', 'pdf-html');
  fs.mkdirSync(tmpDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    for (const target of targets) {
      const mdFull = path.resolve(ROOT_DIR, target.md);
      if (!fs.existsSync(mdFull)) {
        console.log(`⏭ Skip missing ${target.md}`);
        continue;
      }
      const pdfFull = path.resolve(ROOT_DIR, target.pdf);
      const tmpHtml = path.join(tmpDir, `${path.basename(target.md, '.md')}.html`);
      renderMarkdownToHtmlFile(mdFull, tmpHtml);

      const page = await browser.newPage();
      await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'networkidle' });
      await page.pdf({
        path: pdfFull,
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', right: '15mm', bottom: '16mm', left: '15mm' },
      });
      await page.close();
      console.log(`✅ Exported ${target.pdf}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('❌ PDF export failed:', err);
  process.exit(1);
});
