# Reusable Playwright Assertion Patterns & Data Loaders

## 1. External Data Loaders

### CSV Loader (`csv-parse/sync`)
```typescript
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export function loadCsvCases<T>(relativePath: string): T[] {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: false,
  }) as T[];
}
```

### JSON Loader
```typescript
import fs from 'fs';
import path from 'path';

export function loadJsonCases<T>(relativePath: string): T[] {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as T[];
}
```

### Cross-Browser Unique Token Helper
```typescript
export function resolveUnique(value: string, browserName: string, tcId: string): string {
  const token = `${browserName}_${tcId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  return value.replaceAll('{{UNIQUE}}', token);
}
```

---

## 2. Six Distinct Assertion Patterns

1. **URL / Routing Pattern**
   - `await expect(page).toHaveURL(/\/login$/);`
   - `await expect(page).not.toHaveURL(/\/login$/);`
2. **Visibility & Exact Text Pattern**
   - `await expect(page.getByText('Tổng cộng', { exact: false })).toBeVisible();`
   - `await expect(statusBadge).toHaveText('Đã xác nhận');`
3. **HTML Attribute & Visual CSS Pattern**
   - `await expect(emailInput).toHaveAttribute('type', 'email');`
   - `await expect(submitBtn).toHaveClass(/bg-blue-/);`
   - `await expect(decreaseBtn).toBeDisabled();`
4. **Element Count & Layout Geometry Pattern**
   - `await expect(rows).toHaveCount(1);`
   - `const errBox = await errorBanner.boundingBox(); const btnBox = await submitBtn.boundingBox(); expect(errBox!.y).toBeLessThan(btnBox!.y);`
5. **Native Browser Dialog / Alert Safety Pattern**
   - Register listener BEFORE click:
     ```typescript
     let dialogSeen = false;
     page.once('dialog', async (d) => { dialogSeen = true; await d.dismiss(); });
     await deleteBtn.click();
     expect(dialogSeen).toBe(true);
     ```
6. **Network Contract & Stored XSS DOM Hygiene Pattern**
   - `expect(response.status()).toBe(400);`
   - `await expect(cell.locator('b[data-xss], img[onerror]')).toHaveCount(0);`
   - `expect(await page.evaluate(() => (window as any).__xssTriggered)).toBeFalsy();`

---

## 3. Anti-Flakiness Review Checklist
- [ ] Zero `page.waitForTimeout(...)` used as synchronization; rely on web-first assertions (`toBeVisible`, `toHaveText`) or `Promise.all([page.waitForResponse(...), action])`.
- [ ] SPA in-memory state preserved by clicking router `<Link>` elements instead of calling `page.goto()` mid-flow.
- [ ] HTML5 `required` / `type="email"` native constraint validation checked cleanly via `input.evaluate((el: HTMLInputElement) => el.validity.valid)` across Chromium, Firefox, and WebKit.
- [ ] Dialog event handlers attached BEFORE triggering clicks, and unhandled dialogs do not hang WebKit/Firefox.
