import { test, expect, Locator, Page } from '@playwright/test';
import { loadCsvCases, resolveDataValue } from './helpers/data-loader';

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

function fieldInput(page: Page, labelText: string): Locator {
  return page.locator('form div', {
    has: page.locator('label', { hasText: labelText }),
  }).locator('input');
}

test.describe('FR-01: Account Registration (Human-Reviewed Data-Driven)', () => {
  for (const tc of registerCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page }, testInfo) => {
      await page.goto('/register');

      const browser = testInfo.project.name;
      const resolvedName = tc.tcId === 'TC-A13' ? '' : resolveDataValue(tc.name, browser, tc.tcId);
      const resolvedEmail = resolveDataValue(tc.email, browser, tc.tcId);
      const resolvedPass = resolveDataValue(tc.password, browser, tc.tcId);
      const resolvedConfirm = resolveDataValue(tc.confirmPassword, browser, tc.tcId);

      const nameInput = fieldInput(page, 'Họ Tên');
      const emailInput = fieldInput(page, 'Email');
      const passwordInput = fieldInput(page, 'Mật khẩu');
      const submitBtn = page.getByRole('button', { name: 'Đăng Ký' });

      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      if (tc.expectedOutcome === 'confirm_password_reject' || tc.expectedOutcome === 'confirm_password_required') {
        const confirmInput = page.locator('form input[type="password"]').nth(1);
        await expect(confirmInput, 'FR-01 requires a Confirm Password field on Register form').toBeVisible();
        await nameInput.fill(resolvedName);
        await emailInput.fill(resolvedEmail);
        await passwordInput.fill(resolvedPass);
        await confirmInput.fill(resolvedConfirm);
        await submitBtn.click();
        await expect(page).not.toHaveURL(/\/login$/);
        await expect(page.locator('.bg-red-100')).toContainText(tc.expectedText);
        return;
      }

      await nameInput.fill(resolvedName);
      await emailInput.fill(resolvedEmail);
      await passwordInput.fill(resolvedPass);

      if (tc.expectedOutcome === 'html5_required') {
        const targetInput = tc.expectedText === 'email' ? emailInput : passwordInput;
        await submitBtn.click();
        const isInvalid = await targetInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isInvalid).toBe(true);
        await expect(page).toHaveURL(/\/register$/);
        return;
      }

      await submitBtn.click();

      if (tc.expectedOutcome === 'redirect_login') {
        await expect(page).toHaveURL(/\/login$/);
      } else {
        await expect(page).not.toHaveURL(/\/login$/);
        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox).toBeVisible();
        // Verify error is relevant to the violated field rather than masked by flawed regex
        if (tc.expectedOutcome === 'reject_email' || tc.expectedOutcome === 'reject_duplicate' || tc.expectedOutcome === 'reject_registration') {
          await expect(errorBox).toContainText(new RegExp(tc.expectedText, 'i'));
        } else {
          await expect(errorBox).toContainText(tc.expectedText);
        }
      }
    });
  }
});
