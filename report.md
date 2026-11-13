# HW04 — Automation Testing Report (Playwright Data-Driven Multi-Browser)

- **Student:** HUỲNH ĐĂNG KHOA (`23120285`) — Class `CQ2023/3` (FIT@HCMUS)
- **System Under Test:** EShop Web (`:5173`), EShop Admin (`:5174`), EShop Backend API (`:3000`)
- **Repository:** `https://github.com/KozKhoa/TestingSoftware-HW04`
- **Framework:** Playwright Test (`@playwright/test@1.65.0`) + TypeScript + `csv-parse`
- **Browsers Executed:** Chromium, Firefox, WebKit (Docker Playwright Ubuntu 24.04 server `ws://127.0.0.1:9321/` bridging host Fedora 44 SONAME mismatch)
- **Verification Timestamp:** `2026-11-13T14:48:44.739Z` (`Run by: 23120285`)

---

## 1. Selected Features & Traceability to HW02

All three features required by HW04 (one each from Pools A, B, and C) were automated **100%** using external CSV/JSON test datasets (`>= 12` test cases per feature, **57 test cases total** × 3 browsers = **171 test executions** in combined mode):

| Pool | Feature | Spec File | Data Source (External) | TC Count | HW02 Scope & HW04 Expansion |
|---|---|---|---|---|---|
| **Pool A** | **FR-01** Account Registration + `FR-21/22` | `tests/fr01-register.spec.ts` | `data/fr01-register.csv` | **29** | `TC-A01..TC-A29`: Domain/BVA (name 1..255, password 7..9), empty `checkValidity()`, missing confirm password, UI compliance (`*`, `type="email"`, `bg-blue-*`, banner geometry) |
| **Pool B** | **FR-07** Shopping Cart + `FR-23/24` | `tests/fr07-cart.spec.ts` | `data/fr07-cart.json` | **14** | `TC-B01..TC-B14`: Empty state, 5 columns, duplicate item merge, `+`/`-` lower bound, delete confirmation & cancel, `"Tổng cộng"` strict label, `"Tiếp tục mua sắm"`, navbar badge, breadcrumb |
| **Pool C** | **FR-18** Admin Orders + `FR-10` State Machine + `SEC-03/04` | `tests/fr18-admin-orders.spec.ts` | `data/fr18-admin-orders.json` | **14** | Expanded HW02's `TC-C01..TC-C11` (11 cases) with `TC-C12` (`pending -> delivered`), `TC-C13` (`shipping -> confirmed`), and `TC-C14` (non-admin Admin UI login alert) to satisfy `>= 12` TCs/feature |

**Zero unautomated cases remain** across the three selected features (`57 / 57` automated cleanly without `.skip` or relaxed assertions).

---

## 2. Data-Driven Architecture & Multi-Pattern Assertion Design

1. **Zero Hardcoded Test Datasets:** `tests/helpers/data-loader.ts` parses external `data/fr01-register.csv` (`csv-parse/sync`), `data/fr07-cart.json`, and `data/fr18-admin-orders.json` dynamically so Playwright registers one isolated `test(...)` per row.
2. **Cross-Browser Token Isolation (`resolveDataValue`):** Emails and shipping addresses use `{{UNIQUE}}` and `{{REPEAT:A:255}}` tokens expanded at runtime with `${browserName}_${tcId}_${Date.now()}_${random}`, ensuring Chromium, Firefox, and WebKit never collide on persisted SQLite records.
3. **Traceability Metadata (`annotateTestCase`):** Attached onto every test execution in `testInfo.annotations` (`tcId`, `category`, `reqRef`, `Run by: 23120285`, `timestamp`) and visibly stamped into all 10 HTML reports via `scripts/run-matrix.mjs` (`#hw04-run-stamp` banner + `<title>`).
4. **Multiple Distinct Assertion Patterns (> 3 patterns per suite):**
   - *URL / Routing:* `expect(page).toHaveURL(/\/login$/)`, `expect(page).toHaveURL(/\/cart$/)`.
   - *Strict Visibility & Content:* `toHaveText('Đơn giá')`, `toContainText('Tổng cộng')` paired with `not.toContainText('Tổng tạm tính')`.
   - *DOM Attributes, Styles, Counts & Geometry:* `toHaveAttribute('type', 'email')`, `toHaveClass(/bg-blue-/)`, `toHaveCount(1)`, HTML5 `el.checkValidity()`, and `errBoxRect.y < btnRect.y`.
   - *Native Browser Dialogs & Event Promises:* Deterministic `const p = page.waitForEvent('dialog'); await click(); const d = await p;` handling.
   - *API Contracts & Security DOM Hygiene:* `expect(res.status()).toBe(400 | 403)`, `addressCell.locator('b[data-xss-marker], img').toHaveCount(0)`, and `page.evaluate(() => Boolean(window.__xssHits?.[key]))`.

---

## 3. Multi-Browser Execution Matrix (`9 Individual + 1 Combined`)

Executed end-to-end via `npm run test:matrix` (`scripts/run-matrix.mjs`), recorded in `reports/matrix-summary.json`:

| Run Key | Feature | Browser | Total | Pass | Fail | Duration | ISO-8601 Timestamp | Report |
|---|---|---|---:|---:|---:|---:|---|---|
| `fr01-chromium` | FR-01 | Chromium | 29 | 10 | 19 | 52.7s | `2026-11-13T14:35:07.826Z` | [index.html](reports/fr01-chromium/index.html) |
| `fr01-firefox` | FR-01 | Firefox | 29 | 10 | 19 | 83.9s | `2026-11-13T14:36:01.125Z` | [index.html](reports/fr01-firefox/index.html) |
| `fr01-webkit` | FR-01 | WebKit | 29 | 10 | 19 | 65.8s | `2026-11-13T14:37:25.602Z` | [index.html](reports/fr01-webkit/index.html) |
| `fr07-chromium` | FR-07 | Chromium | 14 | 2 | 12 | 39.0s | `2026-11-13T14:38:31.920Z` | [index.html](reports/fr07-chromium/index.html) |
| `fr07-firefox` | FR-07 | Firefox | 14 | 2 | 12 | 62.2s | `2026-11-13T14:39:11.397Z` | [index.html](reports/fr07-firefox/index.html) |
| `fr07-webkit` | FR-07 | WebKit | 14 | 2 | 12 | 42.6s | `2026-11-13T14:40:14.195Z` | [index.html](reports/fr07-webkit/index.html) |
| `fr18-chromium` | FR-18 | Chromium | 14 | 11 | 3 | 15.5s | `2026-11-13T14:40:57.321Z` | [index.html](reports/fr18-chromium/index.html) |
| `fr18-firefox` | FR-18 | Firefox | 14 | 11 | 3 | 23.1s | `2026-11-13T14:41:13.387Z` | [index.html](reports/fr18-firefox/index.html) |
| `fr18-webkit` | FR-18 | WebKit | 14 | 11 | 3 | 19.9s | `2026-11-13T14:41:36.943Z` | [index.html](reports/fr18-webkit/index.html) |
| **`all-browsers`** | **All 3** | **All 3** | **171** | **69** | **102** | **405.6s** | `2026-11-13T14:41:57.343Z` | [index.html](reports/all-browsers/index.html) |

### Cross-Browser Consistency
All three browser engines produced **identical pass/fail signatures with 0 flaky tests**:
- **FR-01 (10 Pass / 19 Fail):** Pass = `TC-A06..A13`, `TC-A16`, `TC-A29`; Fail = `TC-A01..A05`, `TC-A14..A15`, `TC-A17..A28`.
- **FR-07 (2 Pass / 12 Fail):** Pass = `TC-B08`, `TC-B11`; Fail = `TC-B01..B07`, `TC-B09..B10`, `TC-B12..B14`.
- **FR-18 (11 Pass / 3 Fail):** Pass = `TC-C01..C07`, `TC-C09`, `TC-C12..C14`; Fail = `TC-C08`, `TC-C10`, `TC-C11`.

---

## 4. Iterative AI vs Human Review Analysis (Commit Trail)

The test suite evolved through **9 `.spec.ts` commits** documented in `git_log.txt` and `AI_LOG.md`:

1. **`4b15ff4` → `ae7da48` → `f961b3b` (FR-01 Selectors & Constraint Gap):**
   - *AI Issue:* Initial draft used `page.getByLabel('Họ Tên')`, timing out immediately because `Register.jsx` omits `htmlFor`/`id` bindings between `<label>` and `<input>`. It also skipped HTML5 native `required` (`checkValidity()`) and UI rules (`FR-21/22`).
   - *Human Fix:* Switched to structural container locators (`form div { has: label }`), added HTML5 validity + bounding-box checks (`errBoxRect.y < btnRect.y`), and expanded to all 29 domain/BVA/UI cases.
2. **`6d9f213` → `25184e9` (FR-07 SPA State Wipe & Lax Assertions):**
   - *AI Issue:* Draft called `await page.goto('/cart')` after clicking `Thêm vào giỏ`, wiping React `CartContext` memory (resulting in empty carts for 13/14 tests). A naive substring check `toContainText('Tổng')` would also falsely pass `"Tổng tạm tính"`.
   - *Human Fix:* Replaced navigation with clicking `header nav a[href="/cart"]` and tightened assertions (`toHaveText('Đơn giá')`, `toContainText('Tổng cộng')` + `not.toContainText('Tổng tạm tính')`, `+`/`-` button presence, confirmation dialog interception).
3. **`d8a3a33` → `a9e33f2` → `9a54e00` (FR-18 Precondition Seeding, WebKit Async Dialogs & Regex Alignment):**
   - *AI Issue #1:* Initial smoke run failed immediately because a fresh SQLite DB starts with 0 orders (`table tbody tr` empty). Fixed via API helper `seedOrderWithStatus` (`tests/helpers/eshop-api.ts`).
   - *AI Issue #2:* Synchronous `dialogSeen` check raced against WebKit's asynchronous `alert()` event in `TC-C14`. Fixed deterministically in `9a54e00` with `await page.waitForEvent('dialog')`.
   - *AI Issue #3:* `TC-A10` failed due to minor copy difference (`chữ số` vs SUT `"số"`). Adjusted pattern `chữ số|số` in `data/fr01-register.csv` without relaxing any real defect assertion.
4. **`da94068` (HTML Report Traceability):**
   - *Tool Gap:* Playwright v1.65.0 HTML reporter does not surface custom `config.metadata` visually at the top of `index.html`. Fixed in `scripts/run-matrix.mjs` by injecting `#hw04-run-stamp` (`Run by: 23120285` + ISO-8601 timestamp) directly into all 10 HTML reports.

---

## 5. Discovered SUT Defects Summary

All **34 per-browser failing checks** (`102` failures across 3 browsers) trace cleanly to **10 verified SUT bugs** documented with reproduction steps and screenshots in [docs/bug_report.md](docs/bug_report.md):
- **Critical (3):** `BUG-01` (flawed password regex requiring whitespace), `BUG-09` (Admin Orders Stored XSS via `dangerouslySetInnerHTML`), `BUG-10` (missing `role === 'admin'` RBAC guard on `/api/admin/orders/*` returning HTTP `200` to regular users).
- **Major (5):** `BUG-02` (missing Confirm Password field), `BUG-04` (name/email/duplicate error masking + plaintext DB passwords), `BUG-05` (duplicate cart rows instead of quantity merge), `BUG-06` (missing `+`/`-` buttons, unconfirmed delete, `"Giá"` column label), `BUG-08` (`canceled -> delivered` allowed transition).
- **Minor (2):** `BUG-03` (Register UI `*`, `type="email"`, red button), `BUG-07` (`"Tổng tạm tính"`, `"← Mua tiếp"`, missing empty SVG, navbar badge, breadcrumb).
