import fs from 'fs';
import path from 'path';
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
