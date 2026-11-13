import { test, expect } from '@playwright/test';
import { loadCsvCases } from './helpers/data-loader';

interface RegisterCase {
  tcId: string;
  category: string;
  description: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  expectedOutcome: string;
  expectedText: string;
  reqRef: string;
}

const registerCases = loadCsvCases<RegisterCase>('data/fr01-register.csv');

test.describe('FR-01: Account Registration (Initial AI Draft)', () => {
  for (const tc of registerCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page }) => {
      await page.goto('/register');

      // Initial AI attempt uses getByLabel assuming accessible <label for="..."> linkage
      await page.getByLabel('Họ Tên').fill(tc.name);
      await page.getByLabel('Email').fill(tc.email);
      await page.getByLabel('Mật khẩu').fill(tc.password);

      await page.getByRole('button', { name: 'Đăng Ký' }).click();

      if (tc.expectedOutcome === 'redirect_login') {
        await expect(page).toHaveURL(/\/login$/);
      } else {
        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox).toBeVisible();
        await expect(errorBox).toContainText(tc.expectedText);
      }
    });
  }
});
