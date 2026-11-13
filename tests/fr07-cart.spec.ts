import { test, expect } from '@playwright/test';
import { loadJsonCases } from './helpers/data-loader';

interface CartCase {
  tcId: string;
  category: string;
  description: string;
  itemsToAdd: string[];
  action: string;
  expected: Record<string, any>;
  reqRef: string;
}

const cartCases = loadJsonCases<CartCase>('data/fr07-cart.json');

test.describe('FR-07: Shopping Cart (Initial AI Draft)', () => {
  for (const tc of cartCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page }) => {
      await page.goto('/');

      for (const _item of tc.itemsToAdd) {
        // AI draft mistake 1: uses generic .first() button instead of matching product card
        await page.getByRole('button', { name: 'Thêm vào giỏ' }).first().click();
      }

      // AI draft mistake 2: page.goto('/cart') triggers full browser reload and wipes React Context cart
      await page.goto('/cart');

      if (tc.action === 'check_empty_state') {
        await expect(page.getByText(tc.expected.emptyHeading)).toBeVisible();
      } else if (tc.action === 'check_total_label') {
        // AI draft mistake 3: lax substring assertion misses 'Tổng tạm tính' vs 'Tổng cộng'
        await expect(page.locator('body')).toContainText('Tổng');
      } else {
        await expect(page.locator('table tbody tr')).toHaveCount(tc.expected.rowCount || 1);
      }
    });
  }
});
