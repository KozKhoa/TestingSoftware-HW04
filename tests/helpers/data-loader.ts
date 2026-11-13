import fs from 'fs';
import path from 'path';
import type { TestInfo } from '@playwright/test';
import { parse } from 'csv-parse/sync';

/**
 * Load test cases from an external CSV file located relative to project root.
 */
export function loadCsvCases<T>(relativePath: string): T[] {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: false,
  }) as T[];
}

/**
 * Load test cases from an external JSON file located relative to project root.
 */
export function loadJsonCases<T>(relativePath: string): T[] {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as T[];
}

/**
 * Resolve {{UNIQUE}} and {{REPEAT:char:count}} template tokens in data-driven inputs
 * so tests remain isolated across sequential/parallel multi-browser runs.
 */
export function resolveDataValue(
  raw: string,
  browserName: string,
  tcId: string,
  runNonce?: string,
): string {
  const nonce =
    runNonce || `${browserName}_${tcId}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  let resolved = raw.replaceAll('{{UNIQUE}}', nonce);
  resolved = resolved.replace(/\{\{REPEAT:(.+?):(\d+)\}\}/g, (_m, ch, countStr) =>
    ch.repeat(Number(countStr)),
  );
  return resolved;
}

/**
 * Attach Student ID, ISO-8601 timestamp, category, and requirement reference metadata
 * to Playwright test info so traceability appears directly inside HTML/JSON reports.
 */
export function annotateTestCase(
  testInfo: TestInfo,
  tc: { tcId: string; category: string; reqRef: string },
): void {
  const studentId = process.env.STUDENT_ID || '23120285';
  const runTimestamp = process.env.RUN_TIMESTAMP || new Date().toISOString();
  testInfo.annotations.push(
    { type: 'tcId', description: tc.tcId },
    { type: 'category', description: tc.category },
    { type: 'reqRef', description: tc.reqRef },
    { type: 'runBy', description: `Run by: ${studentId}` },
    { type: 'timestamp', description: runTimestamp },
  );
}
