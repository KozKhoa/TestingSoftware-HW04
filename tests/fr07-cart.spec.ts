import { test, expect, Page } from '@playwright/test';
import { annotateTestCase, loadJsonCases } from './helpers/data-loader';

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

async function seedCartAndNavigate(page: Page, itemsToAdd: string[]) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Thêm vào giỏ' }).first()).toBeVisible();

  for (const productName of itemsToAdd) {
    const productCard = page.locator('div.border.rounded', {
      has: page.getByRole('heading', { name: productName }),
    });
    await expect(productCard).toBeVisible();
    await productCard.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  }

  // Navigate via SPA Link to preserve React Context in-memory cart state
  const cartNavLink = page.locator('header nav a[href="/cart"]');
  await cartNavLink.click();
  await expect(page).toHaveURL(/\/cart$/);
}

test.describe('FR-07: Shopping Cart (Human-Reviewed Data-Driven)', () => {
  for (const tc of cartCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page }, testInfo) => {
      annotateTestCase(testInfo, tc);
      if (tc.action === 'check_navbar_badge') {
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Thêm vào giỏ' }).first()).toBeVisible();
        for (const productName of tc.itemsToAdd) {
          const productCard = page.locator('div.border.rounded', {
            has: page.getByRole('heading', { name: productName }),
          });
          await productCard.getByRole('button', { name: 'Thêm vào giỏ' }).click();
        }
        const cartNavLink = page.locator('header nav a[href="/cart"]');
        await expect(cartNavLink, 'Navbar cart link must display badge count').toContainText(
          tc.expected.badgeCount,
        );
        return;
      }

      await seedCartAndNavigate(page, tc.itemsToAdd);

      const rows = page.locator('table tbody tr');

      switch (tc.action) {
        case 'check_empty_state': {
          await expect(page.getByRole('heading', { name: tc.expected.emptyHeading })).toBeVisible();
          await expect(page.getByRole('link', { name: tc.expected.continueLabel })).toBeVisible();
          if (tc.expected.requireIllustration) {
            const illustration = page.locator('main svg, main img');
            await expect(
              illustration.first(),
              'FR-07/FR-24 requires an illustration/icon on Empty Cart state',
            ).toBeVisible();
          }
          break;
        }

        case 'check_table_structure': {
          await expect(rows).toHaveCount(tc.expected.rowCount);
          const headers = page.locator('table thead th');
          await expect(headers).toHaveCount(tc.expected.columns.length);
          for (let i = 0; i < tc.expected.columns.length; i++) {
            await expect(headers.nth(i)).toHaveText(tc.expected.columns[i]);
          }
          if (tc.expected.requireQuantityButtons) {
            await expect(rows.first().getByRole('button', { name: '+' })).toBeVisible();
            await expect(rows.first().getByRole('button', { name: '-' })).toBeVisible();
          }
          break;
        }

        case 'check_duplicate_merge': {
          await expect(
            rows,
            'Adding the same product twice must increment quantity instead of adding a new row',
          ).toHaveCount(tc.expected.rowCount);
          await expect(rows.first().locator('td').nth(2)).toContainText(tc.expected.quantityText);
          await expect(rows.first().locator('td').nth(3)).toContainText(
            new RegExp(tc.expected.subtotalPattern),
          );
          break;
        }

        case 'increment_quantity': {
          const plusBtn = rows.first().getByRole('button', { name: '+' });
          await expect(plusBtn, 'Quantity + control must exist in cart table').toBeVisible();
          await plusBtn.click();
          await expect(rows.first().locator('td').nth(2)).toContainText(tc.expected.quantityText);
          await expect(rows.first().locator('td').nth(3)).toContainText(
            new RegExp(tc.expected.subtotalPattern),
          );
          break;
        }

        case 'decrement_quantity': {
          const minusBtn = rows.first().getByRole('button', { name: '-' });
          await expect(minusBtn, 'Quantity - control must exist in cart table').toBeVisible();
          await minusBtn.click();
          await expect(rows.first().locator('td').nth(2)).toContainText(tc.expected.quantityText);
          await expect(rows.first().locator('td').nth(3)).toContainText(
            new RegExp(tc.expected.subtotalPattern),
          );
          break;
        }

        case 'decrement_at_min': {
          const minusBtn = rows.first().getByRole('button', { name: '-' });
          await expect(minusBtn, 'Quantity - control must exist to enforce min=1 boundary').toBeVisible();
          const isDisabled = await minusBtn.isDisabled();
          if (!isDisabled) {
            let dialogTriggered = false;
            page.once('dialog', async (d) => {
              dialogTriggered = true;
              await d.dismiss();
            });
            await minusBtn.click();
            expect(dialogTriggered).toBe(true);
          }
          break;
        }

        case 'delete_check_dialog': {
          let nativeDialogSeen = false;
          page.once('dialog', async (dialog) => {
            nativeDialogSeen = true;
            await dialog.dismiss();
          });
          await rows.first().getByRole('button', { name: 'Xóa' }).click();
          const modalVisible = await page
            .locator('[role="dialog"], [role="alertdialog"]')
            .isVisible()
            .catch(() => false);
          expect(
            nativeDialogSeen || modalVisible,
            'FR-07/FR-24 requires a confirmation dialog before deleting an item',
          ).toBe(true);
          break;
        }

        case 'delete_and_confirm': {
          page.once('dialog', async (dialog) => {
            await dialog.accept();
          });
          await rows.first().getByRole('button', { name: 'Xóa' }).click();
          const confirmBtn = page.getByRole('button', { name: /Xác nhận|Đồng ý/i });
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
          }
          await expect(page.getByRole('heading', { name: tc.expected.emptyHeading })).toBeVisible();
          break;
        }

        case 'delete_and_cancel': {
          let nativeDialogSeen = false;
          page.once('dialog', async (dialog) => {
            nativeDialogSeen = true;
            await dialog.dismiss();
          });
          await rows.first().getByRole('button', { name: 'Xóa' }).click();
          const cancelModalBtn = page.getByRole('button', { name: /Hủy/i });
          const modalVisible = await cancelModalBtn.isVisible().catch(() => false);
          if (modalVisible) {
            await cancelModalBtn.click();
          }
          expect(
            nativeDialogSeen || modalVisible,
            'Confirmation dialog must appear so user can cancel deletion',
          ).toBe(true);
          await expect(rows).toHaveCount(tc.expected.rowCountAfterCancel);
          break;
        }

        case 'check_total_label': {
          await expect(page.locator('main')).toContainText(tc.expected.exactLabel);
          await expect(page.locator('main')).not.toContainText(tc.expected.forbiddenLabel);
          break;
        }

        case 'check_multi_item_total': {
          await expect(rows).toHaveCount(tc.expected.rowCount);
          await expect(page.locator('main')).toContainText(new RegExp(tc.expected.totalPattern));
          break;
        }

        case 'check_continue_button': {
          const continueLink = page.getByRole('link', { name: tc.expected.buttonLabel, exact: true });
          await expect(
            continueLink,
            `Continue shopping link must have exact label "${tc.expected.buttonLabel}"`,
          ).toBeVisible();
          await continueLink.click();
          await expect(page).toHaveURL(/\/$/);
          break;
        }

        case 'check_breadcrumb': {
          const breadcrumb = page.locator(
            'nav[aria-label*="breadcrumb" i], .breadcrumb, main :text-matches("Trang chủ\\\\s*(>|/|›)\\\\s*Giỏ hàng", "i")',
          );
          await expect(breadcrumb.first(), 'FR-23 requires breadcrumb navigation on /cart').toBeVisible();
          break;
        }
      }
    });
  }
});
