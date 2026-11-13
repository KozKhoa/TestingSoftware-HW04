import { test, expect } from '@playwright/test';
import { loadJsonCases } from './helpers/data-loader';

interface AdminOrderCase {
  tcId: string;
  category: string;
  description: string;
  action: string;
  buttonLabel?: string;
  expectedBadge?: string;
}

const orderCases = loadJsonCases<AdminOrderCase>('data/fr18-admin-orders.json');
const ADMIN_URL = process.env.ADMIN_BASE_URL || 'http://localhost:5174';

test.describe('FR-18: Admin Order Management (Initial AI Draft)', () => {
  for (const tc of orderCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page }) => {
      await page.goto(ADMIN_URL);
      await page.getByPlaceholder('Email').fill('admin@eshop.com');
      await page.getByPlaceholder('Password').fill('Admin123!');
      await page.getByRole('button', { name: 'Login' }).click();

      await page.getByText('Đơn hàng', { exact: true }).click();
      const firstRow = page.locator('table tbody tr').first();
      await expect(firstRow).toBeVisible();

      if (tc.action === 'ui_transition' && tc.buttonLabel && tc.expectedBadge) {
        await firstRow.getByRole('button', { name: tc.buttonLabel }).click();
        await expect(firstRow).toContainText(tc.expectedBadge);
      }
    });
  }
});
