import { test, expect, Page } from '@playwright/test';
import { loadJsonCases, resolveDataValue } from './helpers/data-loader';
import { seedOrderWithStatus } from './helpers/eshop-api';

interface AdminOrderCase {
  tcId: string;
  category: string;
  description: string;
  initialStatus: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'canceled';
  action: string;
  buttonLabel?: string;
  forbiddenButton?: string;
  targetStatus: string;
  expectedBadge?: string;
  expectedStatus?: number;
  shippingAddress: string;
  expectedOutcome: string;
  reqRef: string;
}

const orderCases = loadJsonCases<AdminOrderCase>('data/fr18-admin-orders.json');
const ADMIN_URL = process.env.ADMIN_BASE_URL || 'http://localhost:5174';
const API_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function loginAsAdminAndOpenOrders(page: Page) {
  await page.goto(ADMIN_URL);
  await page.getByPlaceholder('Email').fill('admin@eshop.com');
  await page.getByPlaceholder('Password').fill('Admin123!');
  await page.getByRole('button', { name: 'Login' }).click();

  const ordersMenu = page.locator('ul li', { hasText: 'Đơn hàng' });
  await expect(ordersMenu).toBeVisible();
  await ordersMenu.click();
  await expect(page.getByRole('heading', { name: 'Quản lý Đơn hàng' })).toBeVisible();
}

test.describe('FR-18: Admin Order Management & FR-10 State Machine (Human-Reviewed)', () => {
  for (const tc of orderCases) {
    test(`${tc.tcId} [${tc.category}] ${tc.description}`, async ({ page, request }, testInfo) => {
      if (tc.action === 'non_admin_ui_login') {
        await page.goto(ADMIN_URL);
        await page.getByPlaceholder('Email').fill('test@eshop.com');
        await page.getByPlaceholder('Password').fill('Test1234!');
        const dialogPromise = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Login' }).click();
        const dialog = await dialogPromise;
        const dialogMsg = dialog.message();
        await dialog.accept();
        await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'EShop Admin' })).toHaveCount(0);
        expect(dialogMsg.toLowerCase()).toContain('admin');
        return;
      }

      const nonce = `${testInfo.project.name}_${tc.tcId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const resolvedAddress = resolveDataValue(tc.shippingAddress, testInfo.project.name, tc.tcId, nonce);

      const { orderId, userToken, adminToken } = await seedOrderWithStatus(request, {
        shippingAddress: resolvedAddress,
        initialStatus: tc.initialStatus,
      });

      if (tc.action === 'rbac_user_api') {
        const res = await request.put(`${API_URL}/admin/orders/${orderId}/status`, {
          headers: { Authorization: `Bearer ${userToken}` },
          data: { status: tc.targetStatus },
        });
        expect(
          res.status(),
          'SEC-03/FR-12 requires 403 Forbidden when regular user calls admin order status API',
        ).toBe(tc.expectedStatus);
        return;
      }

      await loginAsAdminAndOpenOrders(page);
      const orderRow = page.locator('table tbody tr', {
        has: page.locator('td', { hasText: new RegExp(`^#${orderId}$`) }),
      });
      await expect(orderRow).toBeVisible();

      switch (tc.action) {
        case 'view_table': {
          const headers = page.locator('table thead th');
          const expectedHeaders = ['ID', 'Người đặt', 'Tổng tiền', 'Địa chỉ', 'Trạng thái', 'Hành động'];
          await expect(headers).toHaveCount(expectedHeaders.length);
          for (let i = 0; i < expectedHeaders.length; i++) {
            await expect(headers.nth(i)).toHaveText(expectedHeaders[i]);
          }
          await expect(orderRow).toContainText(resolvedAddress);
          await expect(orderRow).toContainText('Chờ xác nhận');
          break;
        }

        case 'ui_transition': {
          const actionBtn = orderRow.getByRole('button', { name: tc.buttonLabel!, exact: true });
          await expect(actionBtn).toBeVisible();
          const [putResponse] = await Promise.all([
            page.waitForResponse(
              (r) => r.url().includes(`/admin/orders/${orderId}/status`) && r.request().method() === 'PUT',
            ),
            actionBtn.click(),
          ]);
          expect(putResponse.status()).toBe(200);
          await expect(orderRow).toContainText(tc.expectedBadge!);
          break;
        }

        case 'api_invalid_transition': {
          const res = await request.put(`${API_URL}/admin/orders/${orderId}/status`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { status: tc.targetStatus },
          });
          expect(res.status()).toBe(tc.expectedStatus);
          await page.reload();
          await page.locator('ul li', { hasText: 'Đơn hàng' }).click();
          const refreshedRow = page.locator('table tbody tr', {
            has: page.locator('td', { hasText: new RegExp(`^#${orderId}$`) }),
          });
          await expect(refreshedRow).toContainText(tc.expectedBadge!);
          break;
        }

        case 'terminal_canceled_check': {
          // 1. UI must not display "Đánh dấu Đã giao" on canceled order
          await expect(
            orderRow.getByRole('button', { name: tc.forbiddenButton! }),
            'FR-10 forbids transitioning canceled orders to delivered in UI',
          ).toHaveCount(0);
          // 2. Backend API must reject canceled -> delivered with 400
          const res = await request.put(`${API_URL}/admin/orders/${orderId}/status`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { status: tc.targetStatus },
          });
          expect(res.status(), 'FR-10 forbids canceled -> delivered transition in backend API').toBe(
            tc.expectedStatus,
          );
          break;
        }

        case 'terminal_delivered_check': {
          await expect(orderRow.locator('td').last().locator('button')).toHaveCount(0);
          const res = await request.put(`${API_URL}/admin/orders/${orderId}/status`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { status: tc.targetStatus },
          });
          expect(res.status()).toBe(tc.expectedStatus);
          break;
        }

        case 'xss_check': {
          const addressCell = orderRow.locator('td').nth(3);
          const xssTags = addressCell.locator('b[data-xss-marker], img');
          await expect(
            xssTags,
            'FR-18/SEC-04 requires HTML escaping so shipping_address tags are never parsed into DOM',
          ).toHaveCount(0);
          const executed = await page.evaluate(
            (key) => Boolean((window as any).__xssHits?.[key]),
            nonce,
          );
          expect(executed, 'Stored XSS payload executed JavaScript in Admin browser').toBe(false);
          break;
        }
      }
    });
  }
});
