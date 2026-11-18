import { test, expect, Locator, Page } from '@playwright/test';
import { annotateTestCase, loadJsonCases, resolveDataValue } from './helpers/data-loader';
import { registerViaApi } from './helpers/eshop-api';

interface LoginCase {
  tcId: string;
  category: string;
  description: string;
  email: string;
  password: string;
  registeredPassword?: string;
  preAction: string;
  expectedOutcome: string;
  expectedDetail: string;
  reqRef: string;
}

const loginCases = loadJsonCases<LoginCase>('data/fr02-login.json');

test.describe('FR-02: Login and Account Lockout (Multi-Browser DDT)', () => {
  for (const tc of loginCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page, request }, testInfo) => {
      annotateTestCase(testInfo, tc);

      const browser = testInfo.project.name;
      const resolvedEmail = resolveDataValue(tc.email, browser, tc.tcId);
      const resolvedPassword = resolveDataValue(tc.password, browser, tc.tcId);

      // Pre-condition: Register unique user via API if required
      if (tc.preAction === 'register_user') {
        const cleanEmail = resolvedEmail.trim();
        const regPass = tc.registeredPassword
          ? resolveDataValue(tc.registeredPassword, browser, tc.tcId)
          : resolvedPassword;
        await registerViaApi(request, `User ${tc.tcId}`, cleanEmail, regPass);
      }

      await page.goto('/login');

      // Clear any existing session in localStorage
      await page.evaluate(() => localStorage.clear());

      const emailInput = page.locator('form input').first();
      const passwordInput = page.locator('form input').nth(1);
      const submitBtn = page.locator('form button[type="submit"]');

      // UI Compliance Verifications (FR-21, FR-22, SEC-01)
      if (tc.expectedOutcome === 'ui_heading_text') {
        const heading = page.getByRole('heading', { name: /Đăng nhập/i });
        await expect(
          heading,
          'FR-21 requires Login page heading to display "Đăng nhập"',
        ).toBeVisible();
        return;
      }

      if (tc.expectedOutcome === 'ui_required_asterisk') {
        const labels = page.locator('form label');
        const count = await labels.count();
        expect(count, 'Login form must have labels for Username/Email and Password').toBeGreaterThanOrEqual(2);
        for (let i = 0; i < count; i++) {
          await expect(
            labels.nth(i),
            'FR-22 requires mandatory field labels to contain asterisk indicator (*)',
          ).toContainText('*');
        }
        return;
      }

      if (tc.expectedOutcome === 'ui_email_type') {
        await expect(
          emailInput,
          'FR-02 & FR-22 require email input to have type="email"',
        ).toHaveAttribute('type', 'email');
        return;
      }

      if (tc.expectedOutcome === 'ui_password_type') {
        await expect(
          passwordInput,
          'FR-22 & SEC-01 require password input to have type="password"',
        ).toHaveAttribute('type', 'password');
        return;
      }

      if (tc.expectedOutcome === 'ui_submit_button_label') {
        const vnBtn = page.getByRole('button', { name: 'Đăng nhập' });
        await expect(
          vnBtn,
          'FR-21 requires submit button text to be "Đăng nhập" in Vietnamese',
        ).toBeVisible();
        return;
      }

      if (tc.expectedOutcome === 'ui_submit_button_color') {
        await expect(
          submitBtn,
          'FR-21 requires primary submit button to use blue styling (bg-blue-*)',
        ).toHaveClass(/bg-blue-/);
        return;
      }

      if (tc.expectedOutcome === 'ui_error_above_button') {
        await emailInput.fill(resolvedEmail);
        await passwordInput.fill(resolvedPassword);
        await submitBtn.click();

        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox, 'Error banner must be displayed on failed login').toBeVisible();

        const errBoxRect = await errorBox.boundingBox();
        const btnRect = await submitBtn.boundingBox();
        expect(errBoxRect).not.toBeNull();
        expect(btnRect).not.toBeNull();
        expect(
          errBoxRect!.y,
          'FR-22 requires error banner to appear above the submit button',
        ).toBeLessThan(btnRect!.y);
        return;
      }

      // HTML5 Form Validation Verifications
      if (tc.expectedOutcome === 'html5_required_email') {
        await passwordInput.fill(resolvedPassword);
        await submitBtn.click();

        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isInvalid, 'Empty email input must trigger HTML5 required validation').toBe(true);
        await expect(page).toHaveURL(/\/login$/);
        return;
      }

      if (tc.expectedOutcome === 'html5_required_password') {
        await emailInput.fill(resolvedEmail);
        await submitBtn.click();

        const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isInvalid, 'Empty password input must trigger HTML5 required validation').toBe(true);
        await expect(page).toHaveURL(/\/login$/);
        return;
      }

      if (tc.expectedOutcome === 'html5_invalid_email_type') {
        await emailInput.fill(resolvedEmail);
        await passwordInput.fill(resolvedPassword);
        await submitBtn.click();

        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(
          isInvalid,
          'FR-02 requires email field with type="email" to reject invalid email format via HTML5 validation',
        ).toBe(true);
        await expect(page).toHaveURL(/\/login$/);
        return;
      }

      // Functional Login & Account Lockout Scenarios
      await emailInput.fill(resolvedEmail);

      if (tc.expectedOutcome === 'account_locked') {
        // Attempt 1 with wrong password
        await passwordInput.fill(resolvedPassword);
        await submitBtn.click();
        await page.waitForTimeout(300);

        // Attempt 2 with wrong password (triggers lock threshold >= 3 in backend)
        await submitBtn.click();
        await page.waitForTimeout(300);

        // Attempt 3 with the CORRECT registered password
        const regPass = tc.registeredPassword
          ? resolveDataValue(tc.registeredPassword, browser, tc.tcId)
          : resolvedPassword;
        await passwordInput.fill(regPass);
        await submitBtn.click();
        await page.waitForTimeout(500);

        // Assert that even with correct password, user remains locked out
        await expect(page).toHaveURL(/\/login$/);
        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox).toBeVisible();

        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token, 'Locked user must not receive authentication token').toBeNull();
        return;
      }

      await passwordInput.fill(resolvedPassword);
      await submitBtn.click();

      if (tc.expectedOutcome === 'redirect_home_and_token') {
        await expect(page).not.toHaveURL(/\/login$/, { timeout: 4000 });
        await expect(page).toHaveURL(/\/(#.*)?$/);

        // Verify token in localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token, 'JWT token must be present in localStorage after successful login').toBeTruthy();

        // Verify header navigation bar is visible
        await expect(page.locator('header nav')).toBeVisible();
      } else {
        // Negative / Security rejection
        await expect(page).toHaveURL(/\/login$/);
        const errorBox = page.locator('.bg-red-100');
        await expect(errorBox).toBeVisible();
        await expect(errorBox).toContainText(/Đăng nhập thất bại/i);

        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token, 'Rejected login must not store token in localStorage').toBeNull();
      }
    });
  }
});
