# Worked Example: AI Draft vs Human-Reviewed Data-Driven Spec

## 1. Typical Flawed Single-Prompt AI Output (Before Review)

Problems commonly produced when prompting AI without structured review:
1. **Inline hardcoded dataset** instead of external `.csv`/`.json`.
2. **SPA state loss:** Calls `await page.goto('/cart')` after clicking "Add to cart", wiping React Context in-memory state.
3. **Lax text assertion:** Uses `expect(body).toContain('Tổng')`, which falsely passes when the SUT renders `"Tổng tạm tính"` instead of the spec-mandated `"Tổng cộng"`.
4. **Unchecked delete safety:** Clicks "Xóa" and asserts row disappears, completely missing the requirement for a confirmation dialog (`FR-07`, `FR-24`).

```typescript
// ❌ BEFORE HUMAN REVIEW
const cases = [{ name: 'iPhone 15', qty: 1 }]; // Hardcoded!
test('cart test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.locator('button').nth(1).click(); // Fragile positional selector
  await page.goto('http://localhost:5173/cart'); // Wipes React Context state!
  await expect(page.locator('body')).toContainText('Tổng'); // Lax assertion!
});
```

## 2. Hardened Data-Driven Spec (After Human Review)

```typescript
// ✅ AFTER HUMAN REVIEW
const cartCases = loadJsonCases<CartCase>('data/fr07-cart.json');

for (const tc of cartCases) {
  test(`${tc.tcId}: ${tc.description}`, async ({ page }) => {
    await page.goto('/');
    for (const productName of tc.itemsToAdd) {
      const card = page.locator('div.border.rounded', {
        has: page.getByRole('heading', { name: productName }),
      });
      await card.getByRole('button', { name: 'Thêm vào giỏ' }).click();
    }
    // Preserve React Context state via SPA Link navigation
    await page.getByRole('link', { name: 'Giỏ hàng' }).click();
    await expect(page).toHaveURL(/\/cart$/); // Assertion Pattern 1: URL
    await expect(page.getByText('Tổng cộng:', { exact: false })).toBeVisible(); // Pattern 2: Strict Label
    // Pattern 3: Dialog safety verification
    let confirmShown = false;
    page.once('dialog', async (d) => { confirmShown = true; await d.dismiss(); });
    await page.getByRole('button', { name: 'Xóa' }).first().click();
    expect(confirmShown).toBe(true);
  });
}
```
