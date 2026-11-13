import { test, expect, Locator, Page } from '@playwright/test';
import { annotateTestCase, loadCsvCases, resolveDataValue } from './helpers/data-loader';

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
  return page
    .locator('form div', {
      has: page.locator('label', { hasText: labelText }),
    })
    .locator('input');
}

test.describe('FR-01: Account Registration (Domain, BVA & UI Compliance)', () => {
  for (const tc of registerCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page }, testInfo) => {
      annotateTestCase(testInfo, tc);
      await page.goto('/register');

      const nameInput = fieldInput(page, 'Họ Tên');
      const emailInput = fieldInput(page, 'Email');
      const passwordInput = fieldInput(page, 'Mật khẩu');
      const submitBtn = page.getByRole('button', { name: 'Đăng Ký' });

      // UI Compliance Checks (FR-21, FR-22)
      if (tc.expectedOutcome === 'ui_required_asterisk') {
        const labels = page.locator('form label');
        const count = await labels.count();
        expect(count).toBeGreaterThanOrEqual(3);
        for (let i = 0; i < count; i++) {
          await expect(labels.nth(i)).toContainText('*');
        }
        return;
      }

      if (tc.expectedOutcome === 'ui_email_type') {
        await expect(emailInput).toHaveAttribute('type', tc.expectedText);
        return;
      }

      if (tc.expectedOutcome === 'ui_password_type') {
        await expect(passwordInput).toHaveAttribute('type', tc.expectedText);
        const confirmInput = page.locator('form input[type="password"]').nth(1);
        await expect(confirmInput, 'Confirm password field must exist with type="password"').toBeVisible();
        return;
      }

      if (tc.expectedOutcome === 'ui_button_color') {
        await expect(submitBtn).toHaveClass(/bg-blue-/);
        return;
      }

      if (tc.expectedOutcome === 'ui_error_above_button') {
        const browser = testInfo.project.name;
        await nameInput.fill(resolveDataValue(tc.name, browser, tc.tcId));
        await emailInput.fill(resolveDataValue(tc.email, browser, tc.tcId));
        await passwordInput.fill(tc.password);
        await submitBtn.click();

        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox).toBeVisible();
        const errBoxRect = await errorBox.boundingBox();
        const btnRect = await submitBtn.boundingBox();
        expect(errBoxRect).not.toBeNull();
        expect(btnRect).not.toBeNull();
        expect(errBoxRect!.y).toBeLessThan(btnRect!.y);
        return;
      }

      const browser = testInfo.project.name;
      const resolvedName = resolveDataValue(tc.name, browser, tc.tcId);
      const resolvedEmail = resolveDataValue(tc.email, browser, tc.tcId);
      const resolvedPass = resolveDataValue(tc.password, browser, tc.tcId);
      const resolvedConfirm = resolveDataValue(tc.confirmPassword, browser, tc.tcId);

      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      if (
        tc.expectedOutcome === 'confirm_password_reject' ||
        tc.expectedOutcome === 'confirm_password_required'
      ) {
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
        const targetInput =
          tc.expectedText === 'name'
            ? nameInput
            : tc.expectedText === 'email'
              ? emailInput
              : passwordInput;
        await submitBtn.click();
        const isInvalid = await targetInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isInvalid).toBe(true);
        await expect(page).toHaveURL(/\/register$/);
        return;
      }

      await submitBtn.click();

      if (tc.expectedOutcome === 'redirect_login') {
        await Promise.race([
          page.waitForURL(/\/login$/, { timeout: 2500 }).catch(() => {}),
          page.locator('.bg-red-100').waitFor({ state: 'visible', timeout: 2500 }).catch(() => {}),
        ]);
        if ((await page.locator('.bg-red-100').count()) > 0) {
          const errText = await page.locator('.bg-red-100').innerText();
          expect(errText, `Unexpected registration rejection: ${errText}`).toBe('');
        }
        await expect(page).toHaveURL(/\/login$/);
      } else {
        await expect(page).not.toHaveURL(/\/login$/);
        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox).toBeVisible();
        await expect(errorBox).toContainText(new RegExp(tc.expectedText, 'i'));
      }
    });
  }
});
