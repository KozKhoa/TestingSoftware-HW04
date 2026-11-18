# Kịch bản Quay Video Demo — HW04 Automation Testing

> **Sinh viên:** Huỳnh Đăng Khoa (`23120285`) — Lớp `CQ2023/3` (FIT@HCMUS)
> **Mục tiêu:** Đáp ứng đầy đủ yêu cầu quay video của **Task 2 (≥ 5 phút)** và **Mục 7 Agent Skill (≥ 1 video E2E)**. Sau khi quay và upload Unlisted lên YouTube, điền URL vào `youtube_list.txt` và `README.md`.

---

## Video 1 — Task 2: Playwright Data-Driven Multi-Browser Automation & Human Review (≥ 5 phút, Thuyết minh Tiếng Việt)

**Thời lượng mục tiêu:** 6–8 phút (tối thiểu 5 phút bắt buộc).
**Chuẩn bị trước khi bấm Record:**
1. Mở terminal tại thư mục gốc `HW04`, phóng to font chữ dễ đọc (14–16pt).
2. Khởi động EShop SUT và WebKit server:
   ```bash
   npm run sut:start
   docker run -d --name hw04-webkit --rm --init --network host mcr.microsoft.com/playwright:v1.65.0-noble npx -y playwright@1.65.0 run-server --port 9321 --host 127.0.0.1
   ```
3. Mở sẵn VS Code / editor với 4 tab: [data/fr01-register.csv](../data/fr01-register.csv), [data/fr07-cart.json](../data/fr07-cart.json), [tests/fr07-cart.spec.ts](../tests/fr07-cart.spec.ts), [tests/fr18-admin-orders.spec.ts](../tests/fr18-admin-orders.spec.ts).

### Phần 1 — Xác minh danh tính máy & Tổng quan kiến trúc (0:00 – 1:15)
- **Thao tác terminal:** Chạy:
  ```bash
  whoami && hostname && git log --oneline -n 10
  ```
- **Lời thoại gợi ý:**
  *"Chào thầy/cô và các bạn, mình là Huỳnh Đăng Khoa, MSSV 23120285. Trong video này mình sẽ trình bày bài làm HW04 kiểm thử tự động Data-Driven đa trình duyệt bằng Playwright TypeScript cho hệ thống EShop SUT. Trước tiên trên terminal, lệnh `whoami` và `hostname` xác nhận môi trường thực thi thật trên máy cá nhân, và `git log` cho thấy 9 commit phát triển theo quy trình AI-first + Human Review cho 3 tính năng: FR-01 Đăng ký, FR-07 Giỏ hàng, và FR-18 Quản lý Đơn hàng Admin."*

### Phần 2 — Kiến trúc Data-Driven & Dữ liệu ngoài CSV/JSON (1:15 – 2:30)
- **Thao tác editor (bấm link để mở nhanh):**
  - External datasets: [data/fr01-register.csv](../data/fr01-register.csv) (29 TCs), [data/fr07-cart.json](../data/fr07-cart.json) (14 TCs), [data/fr18-admin-orders.json](../data/fr18-admin-orders.json) (14 TCs)
  - Helper cô lập dữ liệu & gắn metadata: [`resolveDataValue`](../tests/helpers/data-loader.ts#L31) và [`annotateTestCase`](../tests/helpers/data-loader.ts#L50)
- **Lời thoại gợi ý:**
  *"Toàn bộ test data được tách hoàn toàn ra file ngoài dưới thư mục `data/`, tuyệt đối không hardcode mảng test case trong file `.spec.ts`. Đối với dữ liệu cần tính duy nhất giữa 3 trình duyệt như email đăng ký hoặc địa chỉ giao hàng, helper `resolveDataValue` nội suy token `{{UNIQUE}}` kèm tên project và timestamp. Mỗi file spec đều áp dụng ít nhất 3 assertion pattern khác nhau: kiểm tra URL (`toHaveURL`), nội dung hiển thị (`toHaveText`), thuộc tính HTML/CSS (`toHaveAttribute`, `toHaveClass`), dialog xác nhận và mã HTTP từ API (`response.status()`)."*

### Phần 3 — Phân tích 1+ lỗi AI sinh ra & Cách con người Review + Sửa (2:30 – 4:15)
- **Thao tác terminal / editor (bấm link để nhảy thẳng tới từng chỗ cần show):**
  - **FR-07 (SPA State & Strict Label):**
    - Terminal xem diff AI cũ → bản sửa: `git show 25184e9`
    - Code đã sửa trong [tests/fr07-cart.spec.ts](../tests/fr07-cart.spec.ts#L29): dùng [`header nav a[href="/cart"]`](../tests/fr07-cart.spec.ts#L29) (và [dòng 47](../tests/fr07-cart.spec.ts#L47)) thay cho `page.goto('/cart')`; kiểm tra strict [`exactLabel` vs `forbiddenLabel`](../tests/fr07-cart.spec.ts#L188-L189) ứng với [`TC-B10` trong `fr07-cart.json`](../data/fr07-cart.json#L113-L118).
    - Nguyên nhân phía SUT: [`CartContext.jsx`](../eshop-sut/frontend-web/src/context/CartContext.jsx#L9) chỉ lưu giỏ hàng trong React `useState` in-memory.
  - **FR-01 (Selector & HTML5 Validity):**
    - Terminal xem diff AI cũ → bản sửa: `git show ae7da48`
    - Code đã sửa trong [tests/fr01-register.spec.ts](../tests/fr01-register.spec.ts#L21): dùng container locator [`form div`](../tests/fr01-register.spec.ts#L21), kiểm tra [`checkValidity()`](../tests/fr01-register.spec.ts#L121), và kiểm tra UI [`bg-blue-`](../tests/fr01-register.spec.ts#L62).
    - Nguyên nhân phía SUT: [`Register.jsx`](../eshop-sut/frontend-web/src/pages/Register.jsx#L36) thiếu `htmlFor`/`id` trên `<label>` và có [`flawedStrongPasswordRegex`](../eshop-sut/frontend-web/src/pages/Register.jsx#L15).
  - **FR-18 (Async Dialog Race Condition & Security Bugs):**
    - Terminal xem diff AI cũ → bản sửa: `git show 9a54e00`
    - Code đã sửa trong [tests/fr18-admin-orders.spec.ts](../tests/fr18-admin-orders.spec.ts#L45): `await page.waitForEvent('dialog')` cho [`TC-C14`](../data/fr18-admin-orders.json#L166).
    - Các assertion giữ nguyên fail để bắt bug thật: [`TC-C08` (`canceled -> delivered`)](../data/fr18-admin-orders.json#L92) đối chiếu [`server.js#L550`](../eshop-sut/backend/server.js#L550), [`TC-C10` Stored XSS](../tests/fr18-admin-orders.spec.ts#L159) đối chiếu [`App.jsx#L801` (`dangerouslySetInnerHTML`)](../eshop-sut/frontend-admin/src/App.jsx#L801), và [`TC-C11` thiếu RBAC](../tests/fr18-admin-orders.spec.ts#L65) đối chiếu [`server.js#L525`](../eshop-sut/backend/server.js#L525).
- **Lời thoại gợi ý:**
  *"Ở bước Human Review, khi kiểm tra bản AI sinh ban đầu, mình phát hiện nhiều lỗi nghiêm trọng từ AI nếu không review sẽ dẫn tới false pass hoặc sai kết quả:*
  1. *Thứ nhất ở `FR-07`: AI dùng `page.goto('/cart')` sau khi bấm Thêm vào giỏ hàng, làm mất toàn bộ state trong React `CartContext` (vốn chỉ lưu in-memory). Mình sửa lại thành click link `header nav a[href="/cart"]` giống hành vi người dùng SPA, đồng thời siết chặt assertion: yêu cầu đúng chữ `'Tổng cộng'` thay vì `contain('Tổng')` (vốn bị pass nhầm với `'Tổng tạm tính'` của SUT).*
  2. *Thứ hai ở `FR-01`: AI dùng `page.getByLabel('Họ Tên')`, nhưng source `Register.jsx` không gắn `htmlFor`/`id` nên toàn bộ selector timeout. Mình đổi sang locator theo container `form div { has: label }` và bổ sung kiểm tra `checkValidity()` trên 3 browser.*
  3. *Thứ ba ở `FR-18`: Lỗi race condition khi chờ `alert()` ở `TC-C14` trên WebKit — mình sửa thành `await Promise` với `page.waitForEvent('dialog')` trước khi bấm Login. Đặc biệt, mình giữ nguyên các assertion thất bại do lỗi thật của SUT như Regex mật khẩu, nút xóa thiếu confirm dialog, chuyển trạng thái `canceled -> delivered`, và Stored XSS `dangerouslySetInnerHTML` + lỗ hổng thiếu RBAC admin trên API `PUT /api/admin/orders/:id/status`."*

### Phần 4 — Thực thi Multi-Browser trực tiếp (Chromium, Firefox, WebKit) & Kiểm tra HTML Report (4:15 – 6:30)
- **Thao tác terminal:** Chạy trực tiếp 1 suite hoặc ma trận trên cả 3 browser:
  ```bash
  WEBKIT_WS_ENDPOINT=ws://127.0.0.1:9321/ npx playwright test tests/fr18-admin-orders.spec.ts --project=chromium --project=firefox --project=webkit
  ```
  (Hoặc chạy `npm run test:matrix` nếu muốn show đầy đủ 9+1 runs — có thể nói rõ các ca pass/fail).
- Sau đó mở trình duyệt vào [reports/index.html](../reports/index.html) và [reports/all-browsers/index.html](../reports/all-browsers/index.html) (bằng `npx playwright show-report reports/all-browsers` hoặc mở trực tiếp Chrome/Firefox).
- **Lời thoại gợi ý:**
  *"Như thầy/cô thấy, cả 3 engine Chromium, Firefox và WebKit đều chạy đồng nhất: với FR-18, 11/14 test case pass và 3 ca fail phản ánh đúng 3 bug thật (TC-C08 BUG-08, TC-C10 Stored XSS BUG-09, TC-C11 thiếu kiểm tra role Admin trên API BUG-10). Mở HTML report trong `reports/all-browsers/index.html`, góc trên banner hiển thị rõ `Run by: 23120285`, mã ISO-8601 timestamp và chi tiết kết quả theo từng trình duyệt, kèm screenshot lỗi chụp tự động và trace để nộp bug issue lên GitHub."*

---

## Video 2 — Section 7: Agent Skill End-to-End Demo (`.agents/skills/playwright-ddt-multibrowser/`)

**Thời lượng mục tiêu:** 3–5 phút (thuyết minh Tiếng Việt).
**Chuẩn bị trước khi bấm Record:**
1. Đảm bảo EShop SUT đang chạy (`npm run sut:start`) và Docker WebKit server đang lắng nghe ở `:9321`.
2. Mở sẵn 3 tab của Agent Skill trong editor: [SKILL.md](../.agents/skills/playwright-ddt-multibrowser/SKILL.md), [assertion-patterns.md](../.agents/skills/playwright-ddt-multibrowser/resources/assertion-patterns.md), và [sample-ddt-spec.md](../.agents/skills/playwright-ddt-multibrowser/examples/sample-ddt-spec.md).

### Phần 1 — Xác minh danh tính & Giới thiệu cấu trúc Agent Skill (0:00 – 1:00)
- **Thao tác terminal / editor:**
  - Terminal chạy:
    ```bash
    whoami && hostname && ls -la .agents/skills/playwright-ddt-multibrowser/
    ```
  - Mở [SKILL.md](../.agents/skills/playwright-ddt-multibrowser/SKILL.md#L1-L22).
- **Lời thoại gợi ý:**
  *"Chào thầy/cô và các bạn, mình là Huỳnh Đăng Khoa, MSSV 23120285. Trong video thứ hai này, mình sẽ trình diễn Agent Skill `playwright-ddt-multibrowser` mà mình đã xây dựng cho Mục 7 của HW04. Mục tiêu của skill này là chuẩn hóa quy trình để AI hỗ trợ sinh và bảo trì bộ test Playwright Data-Driven đa trình duyệt một cách có kỷ luật, tránh việc AI viết code cứng dữ liệu hoặc tự ý làm lỏng assertion."*

### Phần 2 — Giải thích 5 Phase & 5 Non-Negotiable Rules của Skill (1:00 – 2:15)
- **Thao tác editor (bấm link tới đúng đoạn):**
  - Chỉ vào 5 Phase trong [SKILL.md#L15-L21](../.agents/skills/playwright-ddt-multibrowser/SKILL.md#L15-L21) và 5 Non-Negotiable Rules trong [SKILL.md#L25-L35](../.agents/skills/playwright-ddt-multibrowser/SKILL.md#L25-L35).
  - Mở nhanh [assertion-patterns.md#L43-L73](../.agents/skills/playwright-ddt-multibrowser/resources/assertion-patterns.md#L43-L73) và [sample-ddt-spec.md](../.agents/skills/playwright-ddt-multibrowser/examples/sample-ddt-spec.md) để cho thấy tài nguyên tham chiếu đi kèm skill.
- **Lời thoại gợi ý:**
  *"Skill được thiết kế theo 5 phase chặt chẽ: Inspect SUT trước, tách dữ liệu ra file CSV/JSON ngoài với token `{{UNIQUE}}`, sinh spec với tối thiểu 3 nhóm assertion khác nhau theo mẫu trong `assertion-patterns.md`, bắt buộc Human Review để sửa selector/state/race condition, và cuối cùng chạy ma trận 3 trình duyệt kèm đóng dấu MSSV. Đặc biệt, 5 nguyên tắc bất di bất dịch trong `SKILL.md` cấm AI hardcode test case trong `.spec.ts` và nghiêm cấm nới lỏng assertion khi phát hiện lỗi thật của SUT."*

### Phần 3 — Chat trực tiếp kích hoạt Agent Skill chạy End-to-End trên 1 Feature hoàn chỉnh (2:15 – 4:15)
- **Thao tác chat với AI Agent (Antigravity):**
  - Mở khung chat AI ngay trong IDE và gõ prompt yêu cầu Agent áp dụng skill `playwright-ddt-multibrowser` cho một tính năng hoàn chỉnh (ví dụ `FR-02 Đăng nhập` trên `eshop-sut/frontend-web/src/pages/Login.jsx`, hoặc demo lại quy trình trên `FR-07`):
    ```text
    Hãy dùng skill playwright-ddt-multibrowser để tạo bộ test Playwright Data-Driven đa trình duyệt (Chromium, Firefox, WebKit) cho tính năng FR-02 Đăng nhập (eshop-sut/frontend-web/src/pages/Login.jsx), tách dữ liệu ra file JSON/CSV ngoài, dùng tối thiểu 3 assertion patterns và xuất HTML report có đóng dấu Run by: 23120285.
    ```
  - Quay lại quá trình Agent **tự động đọc [SKILL.md](../.agents/skills/playwright-ddt-multibrowser/SKILL.md)** → **inspect mã nguồn SUT** → **tạo file dữ liệu ngoài (`data/fr02-login.json` hoặc `.csv`)** → **sinh file spec (`tests/fr02-login.spec.ts`)** → **chạy trên cả 3 trình duyệt (`--project=chromium --project=firefox --project=webkit`)**.
  - *(Nếu muốn đối chiếu nhanh với feature đã review kỹ trong bộ nộp bài, mở thêm cặp [data/fr07-cart.json](../data/fr07-cart.json) và [tests/fr07-cart.spec.ts](../tests/fr07-cart.spec.ts#L1-L55), kết hợp [`stampHtmlReport`](../scripts/run-matrix.mjs#L105-L120).)*
- **Lời thoại gợi ý:**
  *"Bây giờ mình sẽ trực tiếp chat với AI Agent và gọi skill `playwright-ddt-multibrowser` để tự động hóa trọn vẹn một tính năng từ đầu đến cuối. Như thầy/cô thấy trên màn hình, ngay khi nhận prompt, Agent tự động load `SKILL.md`, kiểm tra source code SUT trước thay vì đoán mò selector, tách toàn bộ test data ra file ngoài, áp dụng nhiều assertion pattern khác nhau rồi chạy thực tế trên cả Chromium, Firefox và WebKit — giữ nguyên các assertion fail nếu phát hiện lỗi thật của SUT."*

### Phần 4 — Kiểm chứng HTML Reports & Dấu vết tác giả (4:15 – 5:00)
- **Thao tác trình duyệt:**
  - Mở HTML report vừa sinh ra (hoặc mở [reports/index.html](../reports/index.html), [reports/fr07-webkit/index.html](../reports/fr07-webkit/index.html) và [reports/all-browsers/index.html](../reports/all-browsers/index.html)).
- **Lời thoại gợi ý:**
  *"Cuối cùng, mở HTML report sau khi chạy xong, banner ở đầu trang hiển thị rõ `Run by: 23120285` kèm ISO-8601 timestamp và thống kê pass/fail trên từng trình duyệt. Như vậy, Agent Skill giúp tái sử dụng toàn bộ quy trình kiểm thử Data-Driven đa trình duyệt một cách chuẩn hóa, minh bạch và kiểm chứng được. Cảm ơn thầy/cô và các bạn đã theo dõi!"*
