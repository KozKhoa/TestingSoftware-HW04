# AI Interaction Log — HW04 Automation Testing

- **Student:** HUỲNH ĐĂNG KHOA (`23120285`) — Class `CQ2023/3` (FIT@HCMUS)
- **Repository:** `KozKhoa/TestingSoftware-HW04`
- **System Under Test:** `eshop-sut` (`backend` :3000, `frontend-web` :5173, `frontend-admin` :5174)
- **AI Environment:** Antigravity IDE Agent + TypeScript/Playwright Tooling

---

## Entry 1 — Assignment Analysis, Feature Selection & Architecture Decisions

- **Timestamp:** `2026-11-13T21:11:16+07:00`
- **Tool / Model:** Antigravity Agent
- **Artifact / Scope:** Requirements analysis (`2026.HW04.Automation Testing_En.md`), HW02 traceability (`FR-01`, `FR-07`, `FR-18`), environment setup

### Prompt (Verbatim)
````markdown
Đọc yêu cầu đề bài và giúp tôi hoàn thành task này đi
````

### Follow-up Clarification Responses (Verbatim User Selections)
- Port 3000 conflict resolution: `Tôi tắt port 3000 rồi, bạn chạy tiêp đi`
- Target repository: `(Recommended) Dùng repo KozKhoa/TestingSoftware-HW04 (theo convention TestingSoftware-HW03, dùng token trong HW03/.env nếu hợp lệ hoặc đợi bạn tạo repo)`
- Browser & report scope: `(Recommended) Playwright TypeScript trên 3 browser: Chromium, Firefox, WebKit; xuất đủ 9 HTML reports riêng (mỗi feature x browser) + 1`

### AI Response
````markdown
Selected Playwright TypeScript across Chromium, Firefox, and WebKit targeting 3 HW02 features:
1. FR-01 Account Registration (29 TCs -> data/fr01-register.csv)
2. FR-07 Shopping Cart (14 TCs -> data/fr07-cart.json)
3. FR-18 Admin Order Management + FR-10 State Machine (expanded from 11 to 14 TCs -> data/fr18-admin-orders.json to meet >= 12 TCs/feature)

Initialized repo configuration (commit 3f6c11e): package.json, tsconfig.json, playwright.config.ts, scripts/start_sut.sh, scripts/stop_sut.sh, tests/helpers/data-loader.ts, and Agent Skill .agents/skills/playwright-ddt-multibrowser/.
````

### Human Review & Verdict
- **Verdict:** **INCOMPLETE** (during environment smoke check)
- **Findings & Fix:** Host Fedora 44 lacked Ubuntu 24.04 shared libraries required by Playwright's native WebKit binary (`libicudata.so.74`, `libjpeg.so.8`, `libjxl.so.0.8`). Resolved by running the official `mcr.microsoft.com/playwright:v1.65.0-noble` Playwright server on `ws://127.0.0.1:9321/` and wiring optional `WEBKIT_WS_ENDPOINT` in `playwright.config.ts`. Also verified `HW03/.env` token returned HTTP 401 so GitHub Issue creation must wait for user repo visibility + fresh token.

---

## Entry 2 — FR-01 Initial AI Draft vs Live Execution & Human Fixes

- **Timestamps:** `2026-11-13T21:23:41+07:00` → `2026-11-13T21:26:07+07:00` → Fix #8 `2026-11-13T21:34:16+07:00`
- **Artifact / Scope:** `data/fr01-register.csv`, `tests/fr01-register.spec.ts` (`4b15ff4`, `ae7da48`, `f961b3b`, `9a54e00`)

### Prompt (Structured Task Step)
````markdown
Generate initial Playwright data-driven spec tests/fr01-register.spec.ts and external CSV dataset data/fr01-register.csv covering FR-01 Account Registration using getByLabel locators and external unique tokens.
````

### AI Response (Initial Draft Summary — Commit `4b15ff4`)
````markdown
// tests/fr01-register.spec.ts (initial AI draft excerpt)
const nameInput = page.getByLabel('Họ Tên');
const emailInput = page.getByLabel('Email');
const passwordInput = page.getByLabel('Mật khẩu');
````

### Human Review & Fixes Applied
- **Verdict:** **INCOMPLETE**
- **AI Error #1 (DOM Selector Hallucination):** Initial execution timed out because `eshop-sut/frontend-web/src/pages/Register.jsx` renders `<label>` and `<input>` inside sibling `<div>` blocks without `htmlFor`/`id` association. Fixed in `ae7da48` using container-scoped semantic locators `page.locator('form div', { has: page.locator('label', { hasText: labelText }) }).locator('input')`.
- **AI Error #2 (Missing Constraint & UI Checks):** Initial CSV covered only 12 cases and missed HTML5 `checkValidity()`, missing Confirm Password assertions, and `FR-21`/`FR-22` checks (`*` marker, `type="email"`, `bg-blue-*` button, error banner vertical geometry `boundingBox().y`). Expanded to 29 cases in `f961b3b`.
- **AI Error #3 (Over-Strict Vietnamese Substring Expectation):** On Firefox/WebKit checks, `TC-A10` expected `"chữ số"`, while `Register.jsx` renders `"...gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT."` Harmonized regex in `data/fr01-register.csv` (`chữ số|số`, commit `9a54e00`) so `TC-A10` accurately distinguishes genuine rejections (`TC-A01..A05` failing on `BUG-01`) from copy wording.

---

## Entry 3 — FR-07 Shopping Cart Initial Draft Failure & Architectural Rewrite

- **Timestamps:** `2026-11-13T21:26:22+07:00` → `2026-11-13T21:27:38+07:00`
- **Artifact / Scope:** `data/fr07-cart.json`, `tests/fr07-cart.spec.ts` (`6d9f213` -> `25184e9`)

### Prompt (Structured Task Step)
````markdown
Generate data-driven Playwright spec tests/fr07-cart.spec.ts reading data/fr07-cart.json across 14 test cases for FR-07 Shopping Cart (add item, quantity +/-, delete confirmation, totals, empty state, navbar badge, breadcrumb).
````

### AI Response (Initial Draft Summary — Commit `6d9f213`)
````markdown
// Initial draft relied on page.goto('/cart') after adding items on '/':
await page.goto('/');
await addBtn.click();
await page.goto('/cart'); // WIPES REACT CONTEXT STATE!
// 13 of 14 test cases failed falsely with empty cart
````

### Human Review & Fixes Applied
- **Verdict:** **INVALID (Architectural Defect in AI Output) → Replaced in `25184e9`**
- **Root Cause Found by Human Review:**
  1. **SPA In-Memory State Wipe:** `CartContext.jsx` holds `cart` only in React `useState` memory without `localStorage` or backend persistence. Direct `page.goto('/cart')` reloaded the page and erased added items! Fixed by clicking `header nav a[href="/cart"]`.
  2. **Product Card Selector Hardening:** Mapped buttons to specific headings via `page.locator('div.border.rounded', { has: page.getByRole('heading', { name: productName }) })`.
  3. **Strict Spec Assertions (Anti-False-Pass):** Enforced exact assertions rejecting defective SUT behavior rather than relaxing checks — `"Đơn giá"` instead of `"Giá"`, `"Tổng cộng"` forbidding `"Tổng tạm tính"`, `"Tiếp tục mua sắm"` forbidding `"← Mua tiếp"`, single-row merge on duplicate add (`BUG-05`), `+`/`-` quantity controls & confirmation dialog (`BUG-06`), empty-cart SVG & navbar badge & breadcrumb (`BUG-07`).

---

## Entry 4 — FR-18 Admin Order Management, Seeding & Security Review

- **Timestamps:** `2026-11-13T21:28:16+07:00` → `2026-11-13T21:29:09+07:00` → `2026-11-13T21:34:16+07:00`
- **Artifact / Scope:** `data/fr18-admin-orders.json`, `tests/fr18-admin-orders.spec.ts`, `tests/helpers/eshop-api.ts` (`d8a3a33`, `a9e33f2`, `9a54e00`)

### Prompt (Structured Task Step)
````markdown
Generate Playwright data-driven spec tests/fr18-admin-orders.spec.ts and data/fr18-admin-orders.json expanding FR-18 Admin Order Management & FR-10 state transitions to 14 test cases including terminal state checks, XSS escaping, and non-admin RBAC enforcement.
````

### AI Response (Initial Draft Summary — Commit `d8a3a33`)
````markdown
// Initial smoke run on d8a3a33 navigated directly to admin orders table assuming pre-existing rows:
// All 4 smoke cases failed because freshly initialized database.sqlite contains 0 seeded orders.
````

### Human Review & Fixes Applied
- **Verdict:** **INCOMPLETE → Hardened in `a9e33f2` & `9a54e00`**
- **Fix #1 (Deterministic API Seeding):** Created `tests/helpers/eshop-api.ts` (`seedOrderWithStatus`) creating isolated per-test orders via `POST /api/checkout` and stepping them via `PUT /api/admin/orders/:id/status` to match each test's `initialStatus`.
- **Fix #2 (WebKit Async Dialog Race Condition — `TC-C14`):** Initially attached `page.once('dialog', ...)` with a synchronous boolean flag checked right after `click()`, which raced against WebKit's asynchronous alert dispatch (`TC-C14` failed in `a9e33f2`). Replaced in `9a54e00` with `const dialogPromise = page.waitForEvent('dialog'); await click(); const dialog = await dialogPromise;`, fixing Chromium/Firefox/WebKit deterministically (`11 passed, 3 SUT-bug failed`).
- **Fix #3 (Genuine Security Defect Discovery — `BUG-10` & `BUG-09`):** Verified that `PUT /api/admin/orders/:id/status` omits `req.user.role === 'admin'` (`TC-C11` returns HTTP 200 instead of 403) and that `frontend-admin/src/App.jsx` renders `shipping_address` via `dangerouslySetInnerHTML` (`TC-C10` Stored XSS). Both strict checks remain failing as proof.

---

## Entry 5 — Multi-Browser Matrix Runner, Traceability Annotations & HTML Report Stamping

- **Timestamp:** `2026-11-13T21:34:58+07:00`
- **Artifact / Scope:** `playwright.config.ts`, `tests/helpers/data-loader.ts`, `tests/*.spec.ts`, `scripts/run-matrix.mjs` (`da94068`)

### Prompt (Structured Task Step)
````markdown
Implement a 9+1 multi-browser matrix runner (scripts/run-matrix.mjs) producing 9 individual feature x browser HTML reports and 1 combined report, stamping Student ID ("Run by: 23120285") and ISO-8601 timestamp visibly into every index.html, and attach requirement/author metadata annotations cleanly across all 3 spec files.
````

### AI Response & Human Verification
````markdown
Added annotateTestCase(testInfo, tc) helper imported by all 3 spec files, conditional JSON reporter output in playwright.config.ts, and scripts/run-matrix.mjs which executes all 9 individual feature x browser suites plus 1 combined all-browsers run, compiles reports/matrix-summary.json + reports/index.html, and injects a visible header banner ("Run by: 23120285 | Timestamp: <ISO-8601>") before <div id="root"> in all 10 HTML reports (since Playwright v1.65.0 HTML reporter ignores metadata fields visually).
````
- **Verdict:** **VALID (Human-verified by HTML DOM inspection and full 9+1 matrix run)**

---

## Entry 6 — Documentation, Bug Evidence, GitHub Issue Automation & Official AI Audit Form

- **Artifact / Scope:** `docs/bug_report.md`, `scripts/create_github_issues.py`, `scripts/fill_ai_audit_report.py`, `[AI-02] - FIT@HCMUS - AI Audit Report_Vn.docx/.pdf`, `AI_CRITIQUE.md/.pdf`, `report.md/.pdf`, `README.md`, `docs/video_scripts.md`
- **Summary:** Synthesized verified run metrics strictly from `reports/matrix-summary.json`, copied Playwright failure screenshots into `docs/screenshots/bugs/` covering `BUG-01..BUG-10`, dry-run tested `create_github_issues.py`, populated official template `[AI-02]`, and verified word count of `AI_CRITIQUE.md` within the mandatory 200–300 word limit.
