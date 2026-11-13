import { APIRequestContext, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_URL}/login`, {
    data: { email, password },
  });
  expect(res.status(), `Login failed for ${email}`).toBe(200);
  const body = await res.json();
  return body.token as string;
}

export async function seedOrderWithStatus(
  request: APIRequestContext,
  options: {
    shippingAddress: string;
    totalAmount?: number;
    initialStatus?: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'canceled';
  },
): Promise<{ orderId: number; userToken: string; adminToken: string }> {
  const userToken = await loginViaApi(request, 'test@eshop.com', 'Test1234!');
  const adminToken = await loginViaApi(request, 'admin@eshop.com', 'Admin123!');

  const checkoutRes = await request.post(`${API_URL}/checkout`, {
    headers: { Authorization: `Bearer ${userToken}` },
    data: {
      total_amount: options.totalAmount ?? 4000000,
      shipping_address: options.shippingAddress,
    },
  });
  expect(checkoutRes.status()).toBe(200);
  const { orderId } = (await checkoutRes.json()) as { orderId: number };

  const transitionsByTarget: Record<string, string[]> = {
    pending: [],
    confirmed: ['confirmed'],
    shipping: ['confirmed', 'shipping'],
    delivered: ['confirmed', 'shipping', 'delivered'],
    canceled: ['canceled'],
  };

  const steps = transitionsByTarget[options.initialStatus || 'pending'] || [];
  for (const nextStatus of steps) {
    const putRes = await request.put(`${API_URL}/admin/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: nextStatus },
    });
    expect(putRes.status()).toBe(200);
  }

  return { orderId, userToken, adminToken };
}
