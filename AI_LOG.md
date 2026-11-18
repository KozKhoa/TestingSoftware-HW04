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

---

## [Entry - 2026-11-18 09:09:30] Kiểm tra tiến độ và các hạng mục còn thiếu của HW04

- **Timestamp:** `2026-11-18 09:09:30`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`
- **Description:** Đối chiếu toàn bộ cấu trúc project HW04, dữ liệu test, HTML reports (`matrix-summary.json`), git history, trạng thái GitHub repo/issues, `youtube_list.txt`, `README.md`, `docs/bug_report.md`, và môi trường chạy local với yêu cầu đề bài `2026.HW04.Automation Testing_En.md`.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Đọc project HW04 và kiểm tra xem tôi cần phải làm gì nữa
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Tôi đã rà soát toàn bộ project **HW04** đối chiếu với đề bài [2026.HW04.Automation Testing_En.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/2026.HW04.Automation%20Testing_En.md). Phần lớn hạ tầng test, dữ liệu, báo cáo và chứng cứ chạy thật đã hoàn thiện; dưới đây là tình trạng hiện tại và **những việc bạn cần làm tiếp để hoàn tất nộp bài**:

---

### 1. Những phần đã hoàn thành & kiểm chứng

- **Automation Suites & External Test Data (`57` TCs, `0` hardcode):**
  - Pool A (`FR-01`): `29` TCs trong [fr01-register.csv](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr01-register.csv) + [fr01-register.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr01-register.spec.ts).
  - Pool B (`FR-07`): `14` TCs trong [fr07-cart.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr07-cart.json) + [fr07-cart.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr07-cart.spec.ts).
  - Pool C (`FR-18`): `14` TCs trong [fr18-admin-orders.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr18-admin-orders.json) + [fr18-admin-orders.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr18-admin-orders.spec.ts).
  - TypeScript typecheck (`node node_modules/typescript/bin/tsc --noEmit`) pass sạch.
- **Multi-Browser HTML Reports (`9 + 1`):**
  - Đủ 9 report riêng (`fr{01,07,18}-{chromium,firefox,webkit}`) + 1 report gộp (`all-browsers`) + dashboard [reports/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/index.html).
  - Tất cả 10 `index.html` đều có banner `#hw04-run-stamp` hiển thị `Run by: 23120285` và ISO-8601 timestamp; [matrix-summary.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/matrix-summary.json) (`2026-11-13T14:48:44.739Z`) ghi nhận `69/171` pass, `102` fail (đều là bug thật của SUT), `0` flaky.
- **Git Commit Log:** Đã có **9 commits** sửa đổi file `*.spec.ts` (đạt yêu cầu `>= 8` commits của Mục 12).
- **Tài liệu & Agent Skill:** Đã có [report.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/report.md) (+ `.pdf`), [bug_report.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/bug_report.md) (+ `.pdf` + 11 ảnh PNG ở `docs/screenshots/bugs/`), [AI_CRITIQUE.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/AI_CRITIQUE.md) (`268` từ, đúng chuẩn `200–300` từ, + `.pdf`), [AI_LOG.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/AI_LOG.md) (+ `.pdf`), `[AI-02] - FIT@HCMUS - AI Audit Report_Vn.docx` (+ `.pdf`), và Agent Skill [SKILL.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/SKILL.md).

---

### 2. Những việc bạn CẦN LÀM TIẾP

1. **Chuyển GitHub Repo sang Public & Tạo 10 GitHub Issues (`BUG-01..BUG-10`):**
   - Kiểm tra `https://api.github.com/repos/KozKhoa/TestingSoftware-HW04` hiện trả về `404` (repo chưa public hoặc chưa truy cập được công khai), trong khi Mục 12 & 14 yêu cầu **public GitHub repository**.
   - Sau khi bật **Public** cho repo `KozKhoa/TestingSoftware-HW04`, tạo file `.env` từ [.env.example](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.env.example) điền `GITHUB_TOKEN`, rồi chạy [create_github_issues.py](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/create_github_issues.py) (`python3 scripts/create_github_issues.py`) để tạo 10 issues kèm ảnh chứng cứ trên GitHub.

2. **Khôi phục môi trường local (nếu chạy demo trực tiếp để quay video):**
   - Hiện thư mục `eshop-sut/` **chưa có** trong `HW04/` (chạy [start_sut.sh](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/start_sut.sh) sẽ báo thiếu `eshop-sut`).
   - `node_modules/.bin/` hiện **rỗng** (bị mất symlink) và `git status` đang hiển thị 754 file bị đổi file mode `100644 => 100755` (không có thay đổi nội dung).
   - Trước khi quay demo, hãy chạy `npm install` để khôi phục `node_modules/.bin/`, clone/gắn `eshop-sut` vào `HW04/eshop-sut` (và cài dependencies cho SUT), chạy Docker WebKit server port `9321` (nếu host không phải Ubuntu 24.04), và có thể chạy `git config core.filemode false` để tránh nhiễu `git status`.

3. **Quay & Upload 2 Video Unlisted lên YouTube, sau đó điền link:**
   - Hiện cả [youtube_list.txt](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/youtube_list.txt) và Mục 4 của [README.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/README.md) vẫn đang để `[LINK_PENDING]`:
     - **Video Task 2 (`>= 5` phút, thuyết minh tiếng Việt):** Trình diễn script chạy end-to-end trên đa trình duyệt + mở HTML report (`Run by: 23120285` + ISO timestamp), thuyết minh tối thiểu 1 lỗi AI đã sửa khi review, và hiển thị `whoami` + `hostname` (hoặc face-cam).
     - **Video Mục 7 (Agent Skill):** Demo end-to-end cách dùng skill `playwright-ddt-multibrowser` trên một feature hoàn chỉnh.
   - Kịch bản gợi ý đã soạn sẵn trong [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md).

4. **Cập nhật hoàn thiện `README.md`, PDF và `git_log.txt`:**
   - Điền 2 URL YouTube Unlisted vào `youtube_list.txt` và `README.md` (có thể cập nhật thêm trạng thái/link GitHub Issues trong `docs/bug_report.md` và `README.md`).
   - **Kiểm tra bảng Self-Assessment trong `README.md`:** Bảng ở Mục 5 của `README.md` hiện đang chia 5 nhóm weight `20% / 25% / 25% / 15% / 15%` (tổng `87%`), khác với mẫu 5 dòng ở Mục 15 của đề bài (`Task 1 - Feature A: 25`, `Task 1 - Feature B: 25`, `Task 1 - Feature C: 25`, `Task 2 — Demo video: 15`, `Agent Skills: 10`, `Total: 100`). Nên chuẩn hóa lại theo đúng khung 25/25/25/15/10 và điền điểm tự chấm cuối cùng.
   - Chạy lại [export_pdfs.mjs](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/export_pdfs.mjs) (sau khi `npm install`) để đồng bộ các file `.pdf` (`README.pdf`, `AI_LOG.pdf`, `docs/bug_report.pdf`...) với bản `.md` mới nhất (lưu ý tôi đã ghi thêm nhật ký phiên kiểm tra này vào `AI_LOG.md` theo quy định của `AGENTS.md`).
   - Xuất lại [git_log.txt](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/git_log.txt) (hiện mới ghi tới `790ecc5`, chưa có `0e758f9` và các commit sắp tới của bạn) và `git push` toàn bộ lên GitHub.

5. **Đóng gói file `.zip` nộp Moodle:**
   - Hiện chưa có file nén nộp bài. Cần tạo file `23120285_HW04_AI_Automation_<SelfAssessedGrade>.zip` (ví dụ `23120285_HW04_AI_Automation_100.zip`), bao gồm đầy đủ báo cáo (`.md` + `.pdf`), `README.md`, `AI_CRITIQUE` (`.md` + `.pdf`), `AI_LOG` (`.md` + `.pdf`), `[AI-02]` (`.docx` + `.pdf`), `docs/bug_report` (`.md` + `.pdf` + screenshots), `git_log.txt`, `youtube_list.txt`, `reports/`, `tests/`, `data/`, `.agents/skills/` (loại trừ `node_modules/`, `eshop-sut/`, `.env`, `.playwright-tmp/`, `test-results/`).
````

---

## [Entry - 2026-11-18 09:20:30] Tạo commit và push lên GitHub

- **Timestamp:** `2026-11-18 09:20:30`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`, `Git`
- **Description:** Tắt nhiễu `core.filemode` (753 file bị đổi quyền `100644 => 100755` không đổi nội dung), commit [AI_LOG.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/AI_LOG.md), xuất lại [git_log.txt](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/git_log.txt), tạo commit cập nhật lịch sử Git và push lên `origin/main`.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Tiến hành tạo cac commit và push lên đi
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Tôi đã xử lý xong các commit và push lên `origin/main` (`git@github.com:KozKhoa/TestingSoftware-HW04.git`):

1. **Loại bỏ nhiễu file mode:** Đã đặt `git config core.filemode false` để tránh commit nhầm `mode change 100644 => 100755` trên 753 file không hề thay đổi nội dung.
2. **Tạo 2 commit theo chuẩn Conventional Commits trong `AGENTS.md`:**
   - `docs(docs): log progress review and commit session in ai log` — lưu nhật ký các phiên kiểm tra và commit trong [AI_LOG.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/AI_LOG.md).
   - `docs(docs): update git_log.txt with latest commit history` — xuất lại lịch sử commit đầy đủ vào [git_log.txt](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/git_log.txt).
3. **Push & xác nhận trạng thái:** Đã `git push origin main` thành công và kiểm tra `git status` sạch (không còn file pending).

**Lưu ý nhỏ:** Hiện máy chưa cài `pandoc` nên [AI_LOG.pdf](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/AI_LOG.pdf) chưa được render lại. Sau khi bạn quay video, cập nhật link vào `youtube_list.txt` / `README.md` và cài `pandoc`, hãy chạy `node scripts/export_pdfs.mjs` để đồng bộ lại toàn bộ `.pdf`.
````

---

## [Entry - 2026-11-18 09:27:00] Chuyển GitHub repository sang Public và tạo 10 GitHub Issues (`BUG-01..BUG-10`)

- **Timestamp:** `2026-11-18 09:27:00`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`, `GitHub CLI (gh)`, `Python 3`, `Git`
- **Description:** Chuyển repository `KozKhoa/TestingSoftware-HW04` sang `PUBLIC` bằng `gh repo edit`, bổ sung fallback khi thiếu `python-dotenv` trong [create_github_issues.py](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/create_github_issues.py), tạo đủ 10 GitHub Issues (`#1`–`#10`), cập nhật liên kết trong [bug_report.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/bug_report.md) và [README.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/README.md), cập nhật [git_log.txt](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/git_log.txt) và push lên `origin/main`.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Tôi có cái github cli rồi, tiến hành chuyển githbu sang public và tạo github issues cho tôi đi. 
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Tôi đã chuyển repository sang **Public** và tạo đầy đủ **10 GitHub Issues** (`BUG-01..BUG-10`) cho bạn:

1. **Chuyển repo sang Public:**
   - Thực thi `gh repo edit KozKhoa/TestingSoftware-HW04 --visibility public --accept-visibility-change-consequences`.
   - Đã kiểm tra công khai `https://api.github.com/repos/KozKhoa/TestingSoftware-HW04` trả về HTTP `200` (`visibility: PUBLIC`).

2. **Tạo 10 GitHub Issues (`#1`–`#10`):**
   - Trong [create_github_issues.py](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/create_github_issues.py) đã bổ sung fallback `try/except ImportError` cho `dotenv` để script chạy trực tiếp được với `GITHUB_TOKEN` từ `gh auth token` mà không cần cài thêm `python-dotenv`.
   - Tất cả 10 issues đã được tạo kèm nhãn và ảnh screenshot chứng cứ tại [KozKhoa/TestingSoftware-HW04/issues](https://github.com/KozKhoa/TestingSoftware-HW04/issues):
     - `BUG-01`: `#1` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/1`
     - `BUG-02`: `#2` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/2`
     - `BUG-03`: `#3` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/3`
     - `BUG-04`: `#4` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/4`
     - `BUG-05`: `#5` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/5`
     - `BUG-06`: `#6` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/6`
     - `BUG-07`: `#7` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/7`
     - `BUG-08`: `#8` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/8`
     - `BUG-09`: `#9` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/9`
     - `BUG-10`: `#10` — `https://github.com/KozKhoa/TestingSoftware-HW04/issues/10`

3. **Cập nhật tài liệu & Push lên `origin/main`:**
   - Đã cập nhật link issues `#1`–`#10` vào [bug_report.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/bug_report.md), cập nhật trạng thái mục 4 lên `15%` trong [README.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/README.md), ghi nhận nhật ký vào [AI_LOG.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/AI_LOG.md), xuất lại [git_log.txt](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/git_log.txt) và push lên GitHub.

**Việc còn lại duy nhất phía bạn:** quay 2 video YouTube Unlisted theo [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md), điền link vào `youtube_list.txt` & `README.md`, chạy `node scripts/export_pdfs.mjs` (sau khi cài `pandoc` + `npm install`) để đồng bộ `.pdf`, rồi nén file `.zip` nộp Moodle.
````

---

## [Entry - 2026-11-18 09:28:50] Giải đáp về nguồn gốc, thời hạn và bảo mật của GitHub token

- **Timestamp:** `2026-11-18 09:28:50`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`, `GitHub CLI (gh)`, `curl`, `grep`
- **Description:** Kiểm tra headers xác thực từ `https://api.github.com/user` và quét toàn bộ thư mục dự án để xác minh không có GitHub token nào bị hardcode hoặc lưu trong `.env`.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Tôi thấy bạn mới tạo github token, cái token đó expire khi nào vậy? Hiện có đang hard code ở chỗ nào không vậy?
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Tôi **không tạo token mới**, cũng **không lưu hay hardcode** bất kỳ token nào vào mã nguồn hay ổ đĩa:

1. **Nguồn gốc & cách dùng token vừa rồi:**
   - Lệnh chạy [create_github_issues.py](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/create_github_issues.py) chỉ đọc tạm token đang đăng nhập sẵn trong **GitHub CLI keyring** của bạn (`KozKhoa`) thông qua biến môi trường trong bộ nhớ `GITHUB_TOKEN="$(gh auth token)"`.
   - Biến môi trường đó chỉ tồn tại trong đúng một phiên lệnh đó rồi tự hủy ngay sau khi chạy xong.

2. **Kiểm tra hardcode / file `.env` trong project:**
   - Đã quét toàn bộ file trong project theo pattern `ghp_*` / `gho_*` / `github_pat_*`: chỉ có chuỗi mẫu `ghp_your_token_here` tại [.env.example](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BB%81m/Homeworks/HW04/.env.example#L2) và dòng kiểm tra placeholder tại [create_github_issues.py](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BB%81m/Homeworks/HW04/scripts/create_github_issues.py#L251).
   - Không có token thật nào bị hardcode và cũng không có file `.env` trên đĩa.

3. **Token của `gh` CLI (`gho_...`) khi nào hết hạn?**
   - Token bạn đang đăng nhập trong `gh` là **OAuth token** của GitHub CLI (`x-oauth-client-id: 178c6fc778ccc68e1d6a`, scopes: `admin:public_key`, `gist`, `read:org`, `repo`).
   - Đã kiểm tra response header từ `https://api.github.com/user`: GitHub **không trả về header `github-authentication-token-expiration`** — nghĩa là token này **không có thời hạn expire cố định**. Nó chỉ hết hiệu lực nếu bạn tự thu hồi (revoke) trên GitHub Settings / chạy `gh auth logout`, hoặc nếu không được dùng trong thời gian dài (GitHub tự thu hồi token OAuth không hoạt động sau 1 năm).
````

---

## [Entry - 2026-11-18 09:49:10] Giải đáp vị trí các đoạn code và lỗi AI được nhắc trong `docs/video_scripts.md`

- **Timestamp:** `2026-11-18 09:49:10`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`, `Git`, `grep`
- **Description:** Đối chiếu các nội dung trong `docs/video_scripts.md` (dòng 32–40) với mã nguồn hiện tại và lịch sử commit Git để chỉ rõ vị trí từng phần.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
@[/home/khoa/Documents/Four years/Kiểm thử phần mềm/Homeworks/HW04/docs/video_scripts.md:L32-L40]  Mấy cái này tôi không thấy tồn tại trong project vậy?
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Các nội dung ở [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md#L32-L40) **đều có thật**, nhưng được chia làm **3 nhóm vị trí khác nhau** nên khi mở các file hiện tại bạn sẽ không thấy hết cùng lúc:

1. **Những đoạn code ĐÃ SỬA (đang nằm trong code hiện tại):**
   - `header nav a[href="/cart"]` → nằm ở [fr07-cart.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr07-cart.spec.ts#L29) (và dòng 47).
   - `'Tổng cộng'` vs `'Tổng tạm tính'` → nằm ở [fr07-cart.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr07-cart.json#L113-L118).
   - `form div { has: label }` và `checkValidity()` → nằm ở [fr01-register.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr01-register.spec.ts#L21) và [fr01-register.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr01-register.spec.ts#L121).
   - `page.waitForEvent('dialog')` ở `TC-C14` → nằm ở [fr18-admin-orders.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr18-admin-orders.spec.ts#L45).
   - Stored XSS & RBAC (`PUT /api/admin/orders/:id/status`) → nằm ở [fr18-admin-orders.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr18-admin-orders.spec.ts#L65-L159) và [fr18-admin-orders.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr18-admin-orders.json#L117-L133).

2. **Những đoạn code LỖI CŨ CỦA AI (chỉ còn trong Git History):**
   - `page.goto('/cart')`, `page.getByLabel('Họ Tên')`, `page.once('dialog', ...)` là **bản AI nháp ban đầu**, đã bị ghi đè khi sửa lỗi nên không còn ở `HEAD`.
   - Bạn có thể xem lại diff của chúng bằng các lệnh:
     - `git show 25184e9` (xem thay đổi `FR-07`: bỏ `page.goto('/cart')`, siết `'Tổng cộng'`)
     - `git show ae7da48` (xem thay đổi `FR-01`: bỏ `getByLabel`, thêm `form div` & `checkValidity()`)
     - `git show 9a54e00` (xem thay đổi `FR-18`: sửa `waitForEvent('dialog')`)

3. **Source code của SUT (`Register.jsx`, `CartContext.jsx`, `dangerouslySetInnerHTML`):**
   - Các tên file này thuộc **mã nguồn ứng dụng EShop (`eshop-sut/`)** chứ không thuộc repo test `HW04`.
   - Hiện thư mục `eshop-sut/` chưa có trong `HW04/` (bị ignore bởi `.gitignore`), nên bạn sẽ không thấy các file `.jsx` đó trong cây thư mục hiện tại cho đến khi clone/đặt `eshop-sut` vào `HW04/eshop-sut`.
````

---

## [Entry - 2026-11-18 09:55:20] Bổ sung clickable links kèm số dòng vào `docs/video_scripts.md`

- **Timestamp:** `2026-11-18 09:55:20`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`, `grep`
- **Description:** Gắn link trực tiếp kèm số dòng (`#L...`) tới các file dataset (`data/*`), test spec (`tests/*`), helper (`data-loader.ts`), mã nguồn SUT (`eshop-sut/*`), Agent Skill (`.agents/skills/playwright-ddt-multibrowser/*`) và HTML reports (`reports/*`) trong [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md).

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Trong vide_scripts bổ sung thêm các link tới file đi, tôi chỉ cần ấn vào là đi đến file và vị trí luôn, không cần phải kiếm thủ công nữa, đặc biệt là ở vị trí mà cần phài show ra, demo code hay là user thay đổi cái gì cùa  AI 
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Tôi đã bổ sung đầy đủ link trực tiếp kèm số dòng (`#L...`) vào [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md) để bạn bấm mở thẳng tới đúng vị trí khi quay video:

- **Phần 2 (Data-Driven & Helpers):** link tới [fr01-register.csv](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr01-register.csv), [fr07-cart.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr07-cart.json), [fr18-admin-orders.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr18-admin-orders.json), `resolveDataValue` ([data-loader.ts#L31](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/helpers/data-loader.ts#L31)) và `annotateTestCase` ([data-loader.ts#L50](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/helpers/data-loader.ts#L50)).
- **Phần 3 (Các lỗi AI & vị trí sửa + SUT gốc):**
  - **FR-07:** [fr07-cart.spec.ts#L29](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr07-cart.spec.ts#L29) (`header nav a[href="/cart"]`), [fr07-cart.spec.ts#L188-L189](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr07-cart.spec.ts#L188-L189), [fr07-cart.json#L113-L118](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr07-cart.json#L113-L118), và [CartContext.jsx#L9](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/eshop-sut/frontend-web/src/context/CartContext.jsx#L9).
  - **FR-01:** [fr01-register.spec.ts#L21](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr01-register.spec.ts#L21), [fr01-register.spec.ts#L62](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr01-register.spec.ts#L62), [fr01-register.spec.ts#L121](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr01-register.spec.ts#L121), và [Register.jsx#L15](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/eshop-sut/frontend-web/src/pages/Register.jsx#L15) / [Register.jsx#L36](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/eshop-sut/frontend-web/src/pages/Register.jsx#L36).
  - **FR-18:** [fr18-admin-orders.spec.ts#L45](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr18-admin-orders.spec.ts#L45) (`waitForEvent('dialog')`), [fr18-admin-orders.spec.ts#L65](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr18-admin-orders.spec.ts#L65), [fr18-admin-orders.spec.ts#L159](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr18-admin-orders.spec.ts#L159), [App.jsx#L801](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/eshop-sut/frontend-admin/src/App.jsx#L801) (`dangerouslySetInnerHTML`), [server.js#L525](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/eshop-sut/backend/server.js#L525) & [server.js#L550](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/eshop-sut/backend/server.js#L550).
- **Phần 4 & Video 2 (HTML Reports & Agent Skill):** link tới [reports/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/index.html), [reports/all-browsers/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/all-browsers/index.html), [reports/fr07-webkit/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/fr07-webkit/index.html), và [SKILL.md#L15-L35](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/SKILL.md#L15-L35) cùng `assertion-patterns.md` & `sample-ddt-spec.md`.
````

---

## [Entry - 2026-11-18 10:00:30] Bổ sung kịch bản thuyết trình chi tiết cho Video 2 (Agent Skill Demo)

- **Timestamp:** `2026-11-18 10:00:30`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`
- **Description:** Mở rộng mục Video 2 trong [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md#L67-L106) thành 4 phần hoàn chỉnh (3–5 phút) kèm thao tác terminal/editor, link trực tiếp tới dòng code và lời thoại tiếng Việt.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Cho tôi kịch bản thuyết trình cho Video 2 luôn đi
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Tôi đã bổ sung kịch bản thuyết trình chi tiết cho **Video 2 (Section 7: Agent Skill End-to-End Demo)** vào [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md#L67-L106) gồm 4 phần (3–5 phút), có sẵn lệnh chạy, link nhảy thẳng tới từng dòng và lời thoại tiếng Việt:

1. **Phần 1 (0:00 – 1:00):** Chạy `whoami && hostname && ls -la .agents/skills/playwright-ddt-multibrowser/` và mở [SKILL.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/SKILL.md#L1-L22) để giới thiệu mục tiêu Agent Skill.
2. **Phần 2 (1:00 – 2:15):** Trình bày 5 Phase ([SKILL.md#L15-L21](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/SKILL.md#L15-L21)), 5 Non-Negotiable Rules ([SKILL.md#L25-L35](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/SKILL.md#L25-L35)), [assertion-patterns.md#L43-L73](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/resources/assertion-patterns.md#L43-L73) và [sample-ddt-spec.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/examples/sample-ddt-spec.md).
3. **Phần 3 (2:15 – 3:45):** Mở [fr07-cart.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr07-cart.json), [fr07-cart.spec.ts#L1-L55](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr07-cart.spec.ts#L1-L55), [`stampHtmlReport`](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/run-matrix.mjs#L105-L120) và chạy thực tế `FR-07` trên Chromium, Firefox, WebKit (hoặc `npm run test:matrix`).
4. **Phần 4 (3:45 – 4:30):** Mở [reports/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/index.html), [reports/fr07-webkit/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/fr07-webkit/index.html) và [reports/all-browsers/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/all-browsers/index.html) xác nhận tem `Run by: 23120285` + ISO-8601 timestamp.
````

---

## [Entry - 2026-11-18 10:08:50] Chẩn đoán lỗi `playwright: command not found` và `Missing Playwright JSON report`

- **Timestamp:** `2026-11-18 10:08:50`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`
- **Description:** Kiểm tra `node_modules/.bin/` và giải thích nguyên nhân lỗi `sh: line 1: playwright: command not found` khi chạy `npx playwright` và `Missing Playwright JSON report` khi chạy `npm run test:matrix`.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Lỗi này là gì vậy? ╰─$ npm run test:matrix

> testing-software-hw04-automation@1.0.0 test:matrix
> node scripts/run-matrix.mjs

ℹ Detected local Playwright WebKit server at ws://127.0.0.1:9321/

▶ [fr01-chromium] Running: playwright test tests/fr01-register.spec.ts --project=chromium
❌ Matrix execution failed: Error: Missing Playwright JSON report at /home/khoa/Documents/Four years/Kiểm thử phần mềm/Homeworks/HW04/.playwright-tmp/json/fr01-chromium.json
    at summarizeJsonReport (file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/run-matrix.mjs:81:11)
    at executePlaywrightRun (file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/run-matrix.mjs:164:19)
    at main (file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/run-matrix.mjs:267:22)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
╭─khoa@static ~/Documents/Four years/Kiểm thử phần mềm/Homeworks/HW04 ‹main●› 
╰─$ WEBKIT_WS_ENDPOINT=ws://127.0.0.1:9321/ npx playwright test tests/fr18-admin-orders.spec.ts --project=chromium --project=firefox --project=webkit                                    1 ↵

sh: line 1: playwright: command not found
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Cả hai lỗi trên đều xuất phát từ **cùng một nguyên nhân**: thư mục `node_modules/.bin/` hiện đang **rỗng (`total 0`)** do mất các symlink khi copy/di chuyển thư mục project.

1. Khi chạy `npx playwright ...`, `npx` tìm file thực thi trong `node_modules/.bin/playwright` nhưng không thấy nên báo `sh: line 1: playwright: command not found`.
2. Khi chạy `npm run test:matrix`, [run-matrix.mjs](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/run-matrix.mjs#L164) cũng gọi `playwright test ...`, lệnh này chết ngay từ đầu nên không tạo được file JSON ở `.playwright-tmp/json/fr01-chromium.json`, dẫn tới lỗi `Missing Playwright JSON report`.

**Cách sửa:** Chạy lại lệnh sau tại thư mục `HW04` để npm khôi phục toàn bộ symlink trong `node_modules/.bin/`:

```bash
npm install
```

*(Nếu bên trong `eshop-sut/backend`, `eshop-sut/frontend-web`, `eshop-sut/frontend-admin` cũng bị mất symlink `node_modules/.bin/` tương tự, bạn chạy `npm install` ở từng thư mục đó trước khi `npm run sut:start` nhé.)*
````

---

## [Entry - 2026-11-18 10:24:05] Bổ sung phần chat trực tiếp với AI Agent vào kịch bản Video 2

- **Timestamp:** `2026-11-18 10:24:05`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity AI Agent`
- **Description:** Cập nhật Phần 3 & Phần 4 của Video 2 trong [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md#L91-L106) để bổ sung bước chat trực tiếp với AI Agent kích hoạt skill `playwright-ddt-multibrowser` end-to-end trên một feature hoàn chỉnh.

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
ủa video 2 là demo agent skill sao tôi không thấy phần demo nào chat với agent hết vậy?
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Đúng rồi, phần đó nãy còn thiếu bước **chat trực tiếp gọi Agent Skill** như yêu cầu Mục 7 của đề bài. Tôi đã cập nhật lại **Phần 3 & Phần 4** của Video 2 trong [video_scripts.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/docs/video_scripts.md#L91-L106):

- **Bổ sung prompt mẫu để bạn copy-paste trực tiếp vào khung chat AI** (yêu cầu Agent dùng skill `playwright-ddt-multibrowser` tự động hóa trọn vẹn tính năng `FR-02 Đăng nhập` trên `eshop-sut/frontend-web/src/pages/Login.jsx`, hoặc demo lại trên `FR-07`).
- **Thao tác quay màn hình rõ ràng:** quay cảnh Agent tự đọc [SKILL.md](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/.agents/skills/playwright-ddt-multibrowser/SKILL.md) → inspect SUT → tạo file CSV/JSON ngoài → sinh `.spec.ts` với `>= 3` assertion patterns → chạy trên Chromium, Firefox, WebKit → mở HTML report có tem `Run by: 23120285`.
````

---

## [Entry - 2026-11-18 11:25:00] Triển khai Agent Skill playwright-ddt-multibrowser cho tính năng FR-02 Đăng nhập

- **Timestamp:** `2026-11-18 11:25:00`
- **User / Prompter:** `KozKhoa (@kozkhoa)`
- **Tools:** `Antigravity (Gemini 3.8 Flash)`
- **Description:** Triển khai Agent Skill `playwright-ddt-multibrowser` end-to-end cho tính năng FR-02 Đăng nhập & Khóa tài khoản (`Login.jsx`): tạo dataset ngoài `data/fr02-login.json` (18 test cases), sinh bộ test Playwright `tests/fr02-login.spec.ts` áp dụng 5 assertion patterns, rà soát Human Review phát hiện & bảo toàn nghiêm ngặt 7 lỗi SUT thực tế, nâng cấp `scripts/run-matrix.mjs` chạy matrix đa trình duyệt (Chromium, Firefox, WebKit), và xuất 4 HTML reports có đóng dấu banner `Run by: 23120285` và ISO-8601 timestamp (`reports/fr02-chromium`, `reports/fr02-firefox`, `reports/fr02-webkit`, `reports/fr02-all-browsers`).

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
Hãy dùng skill /playwright-ddt-multibrowser  để tạo bộ test Playwright Data-Driven đa trình duyệt (Chromium, Firefox, WebKit) cho tính năng FR-02 Đăng nhập (eshop-sut/frontend-web/src/pages/Login.jsx), tách dữ liệu ra file JSON/CSV ngoài, dùng tối thiểu 3 assertion patterns và xuất HTML report có đóng dấu Run by: 23120285.
```

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

````markdown
Đã áp dụng trọn vẹn quy trình 5 Phase của Agent Skill **`playwright-ddt-multibrowser`** để xây dựng bộ test Data-Driven đa trình duyệt cho tính năng **FR-02 Đăng nhập & Khóa tài khoản** (`eshop-sut/frontend-web/src/pages/Login.jsx`).

---

### 1. Các thành phần đã tạo và cấu hình

1. **Dataset ngoài (External JSON Dataset):**
   - File: [data/fr02-login.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr02-login.json)
   - Chứa **18 test cases** phân nhóm: Positive (3 TCs), Negative (5 TCs), Edge & Lockout (2 TCs), UI & Security Compliance (8 TCs).
   - Sử dụng token `{{UNIQUE}}` để cô lập dữ liệu người dùng (`login_user_{{UNIQUE}}@eshop.com`, `lockout_{{UNIQUE}}@eshop.com`) giữa các browser chạy đồng thời/tuần tự, tránh làm khóa tài khoản seed dùng chung.

2. **Kịch bản kiểm thử Playwright Data-Driven:**
   - File: [tests/fr02-login.spec.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/fr02-login.spec.ts)
   - Helper đăng ký tài khoản API: [tests/helpers/eshop-api.ts](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/tests/helpers/eshop-api.ts#L18-L30) (`registerViaApi`).

3. **Hỗ trợ chạy Matrix & Đóng dấu HTML Report:**
   - File: [scripts/run-matrix.mjs](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/scripts/run-matrix.mjs#L13-L17) (bổ sung flag `--feature=fr02`).

---

### 2. Tối thiểu 3 Assertion Patterns đã áp dụng (Thực tế áp dụng 5 patterns)

1. **Navigation & URL Assertions:**
   - `expect(page).toHaveURL(/\/(#.*)?$/)` (xác nhận chuyển hướng trang chủ `/` khi đăng nhập thành công).
   - `expect(page).toHaveURL(/\/login$/)` (xác nhận giữ nguyên trang `/login` khi bị từ chối).
2. **Content & Visibility Assertions:**
   - `expect(page.locator('.bg-red-100')).toBeVisible()`.
   - `expect(page.locator('.bg-red-100')).toContainText(/Đăng nhập thất bại/i)`.
   - `expect(page.locator('header nav')).toBeVisible()`.
3. **DOM Attributes, Geometry & CSS Styling Assertions:**
   - `expect(emailInput).toHaveAttribute('type', 'email')`.
   - `expect(passwordInput).toHaveAttribute('type', 'password')`.
   - `expect(submitBtn).toHaveClass(/bg-blue-/)`.
   - `expect(errBoxRect.y).toBeLessThan(btnRect.y)` (kiểm tra banner lỗi phải nằm **trên** nút bấm theo FR-22).
4. **HTML5 Form Validation State Assertions:**
   - `expect(await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity())).toBe(true)`.
   - `expect(await passwordInput.evaluate((el: HTMLInputElement) => !el.checkValidity())).toBe(true)`.
5. **Storage & Security Token Assertions:**
   - `expect(await page.evaluate(() => localStorage.getItem('token'))).toBeTruthy()`.
   - `expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()`.

---

### 3. Quy trình Human Adversarial Review & Bảo toàn lỗi SUT (Rule 4)

Trong quá trình rà soát (Phase 4):
- **Phát hiện lỗi kịch bản ban đầu:** Test case `TC-L04` và `TC-L11` đăng ký tài khoản mới bằng API với mật khẩu sai nên khi submit bị nhận diện thành đăng nhập thành công. Đã sửa trong [data/fr02-login.json](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/data/fr02-login.json) trường `registeredPassword: "CorrectPassword123!"` độc lập với `password` nhập vào form.
- **Bảo toàn nghiêm ngặt 7 lỗi SUT thực tế (Strict Defect Preservation):**
  1. `TC-L08`: SUT dùng `type="text"` cho input email nên không chặn được định dạng thiếu `@` bằng HTML5 native validation (vi phạm FR-02 & FR-22).
  2. `TC-L12`: Tiêu đề form đăng nhập hiển thị sai là `<h2>Đăng Ký</h2>` thay vì `<h2>Đăng nhập</h2>` (vi phạm FR-21).
  3. `TC-L13`: Nhãn các trường bắt buộc thiếu ký hiệu `*` (vi phạm FR-22).
  4. `TC-L14`: Input Email mang thuộc tính `type="text"` thay vì `type="email"` (vi phạm FR-02 & FR-22).
  5. `TC-L15`: Input Mật khẩu mang thuộc tính `type="text"` làm lộ mật khẩu plaintext (vi phạm nghiêm trọng FR-22 & SEC-01).
  6. `TC-L16`: Nút submit hiển thị nhãn tiếng Anh `"Sign In"` thay vì tiếng Việt `"Đăng nhập"` (vi phạm FR-21).
  7. `TC-L18`: Banner thông báo lỗi hiển thị **bên dưới** nút submit thay vì phía trên (vi phạm FR-22).

---

### 4. Kết quả thực thi Ma trận Đa trình duyệt (Phase 5)

Chạy lệnh: `node scripts/run-matrix.mjs --feature=fr02`

| Browser | Số TC | Passed | Failed (Lỗi SUT) | Thời gian | HTML Report có đóng dấu |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Chromium** | 18 | 11 | 7 | 22.2s | [reports/fr02-chromium/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/fr02-chromium/index.html) |
| **Firefox** | 18 | 11 | 7 | 33.1s | [reports/fr02-firefox/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/fr02-firefox/index.html) |
| **WebKit** | 18 | 11 | 7 | 26.5s | [reports/fr02-webkit/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/fr02-webkit/index.html) |
| **Combined (All Browsers)** | **54** | **33** | **21** | **81.7s** | [reports/fr02-all-browsers/index.html](file:///home/khoa/Documents/Four%20years/Ki%E1%BB%83m%20th%E1%BB%AD%20ph%E1%BA%A7n%20m%E1%BB%81m/Homeworks/HW04/reports/fr02-all-browsers/index.html) |

Mọi HTML report đều có banner nổi bật và tiêu đề `<title>` được đóng dấu:
- **Run by:** `23120285`
- **Timestamp:** Định dạng chuẩn ISO-8601 (ví dụ `2026-11-18T04:11:06.197Z`)
- **Metadata Playwright:** ghi nhận `feature`, `browser`, `runBy` và `studentId`.
````

---
