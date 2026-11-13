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
3. Mở sẵn VS Code / editor với 4 tab: `data/fr01-register.csv`, `data/fr07-cart.json`, `tests/fr07-cart.spec.ts`, `tests/fr18-admin-orders.spec.ts`.

### Phần 1 — Xác minh danh tính máy & Tổng quan kiến trúc (0:00 – 1:15)
- **Thao tác terminal:** Chạy:
  ```bash
  whoami && hostname && git log --oneline -n 10
  ```
- **Lời thoại gợi ý:**
  *"Chào thầy/cô và các bạn, mình là Huỳnh Đăng Khoa, MSSV 23120285. Trong video này mình sẽ trình bày bài làm HW04 kiểm thử tự động Data-Driven đa trình duyệt bằng Playwright TypeScript cho hệ thống EShop SUT. Trước tiên trên terminal, lệnh `whoami` và `hostname` xác nhận môi trường thực thi thật trên máy cá nhân, và `git log` cho thấy 9 commit phát triển theo quy trình AI-first + Human Review cho 3 tính năng: FR-01 Đăng ký, FR-07 Giỏ hàng, và FR-18 Quản lý Đơn hàng Admin."*

### Phần 2 — Kiến trúc Data-Driven & Dữ liệu ngoài CSV/JSON (1:15 – 2:30)
- **Thao tác editor:** Mở `data/fr01-register.csv` (29 test cases), `data/fr07-cart.json` (14 test cases), `data/fr18-admin-orders.json` (14 test cases) và `tests/helpers/data-loader.ts`.
- **Lời thoại gợi ý:**
  *"Toàn bộ test data được tách hoàn toàn ra file ngoài dưới thư mục `data/`, tuyệt đối không hardcode mảng test case trong file `.spec.ts`. Đối với dữ liệu cần tính duy nhất giữa 3 trình duyệt như email đăng ký hoặc địa chỉ giao hàng, helper `resolveDataValue` nội suy token `{{UNIQUE}}` kèm tên project và timestamp. Mỗi file spec đều áp dụng ít nhất 3 assertion pattern khác nhau: kiểm tra URL (`toHaveURL`), nội dung hiển thị (`toHaveText`), thuộc tính HTML/CSS (`toHaveAttribute`, `toHaveClass`), dialog xác nhận và mã HTTP từ API (`response.status()`)."*

### Phần 3 — Phân tích 1+ lỗi AI sinh ra & Cách con người Review + Sửa (2:30 – 4:15)
- **Thao tác terminal / editor:** Chạy `git show 25184e9` hoặc mở `tests/fr07-cart.spec.ts` và `tests/fr18-admin-orders.spec.ts`.
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
- Sau đó mở trình duyệt vào `reports/index.html` và `reports/all-browsers/index.html` (bằng `npx playwright show-report reports/all-browsers` hoặc mở trực tiếp Chrome/Firefox).
- **Lời thoại gợi ý:**
  *"Như thầy/cô thấy, cả 3 engine Chromium, Firefox và WebKit đều chạy đồng nhất: với FR-18, 11/14 test case pass và 3 ca fail phản ánh đúng 3 bug thật (TC-C08 BUG-08, TC-C10 Stored XSS BUG-09, TC-C11 thiếu kiểm tra role Admin trên API BUG-10). Mở HTML report trong `reports/all-browsers/index.html`, góc trên banner hiển thị rõ `Run by: 23120285`, mã ISO-8601 timestamp và chi tiết kết quả theo từng trình duyệt, kèm screenshot lỗi chụp tự động và trace để nộp bug issue lên GitHub."*

---

## Video 2 — Section 7: Agent Skill End-to-End Demo (`.agents/skills/playwright-ddt-multibrowser/`)

**Thời lượng mục tiêu:** 3–4 phút (thuyết minh Tiếng Việt).
**Các bước thao tác trực tiếp trên màn hình:**
1. Mở Terminal chạy `whoami && hostname` và mở thư mục `.agents/skills/playwright-ddt-multibrowser/` (cho thấy `SKILL.md`, `resources/assertion-patterns.md`, `examples/sample-ddt-spec.md`).
2. Giải thích ngắn gọn 5 phase và 5 Non-Negotiable Rules trong `SKILL.md` (Zero Hardcoded Test Data, >= 3 Assertion Patterns, Cross-Browser `{{UNIQUE}}` isolation, Strict Defect Preservation, `Run by: 23120285` HTML stamping).
3. Kích hoạt Agent với skill `playwright-ddt-multibrowser` (hoặc trình diễn luồng skill chạy `npm run test:matrix` sinh ra ma trận 9+1 reports) và chứng minh file `.spec.ts` + `.csv`/`.json` + `reports/index.html` được tạo đúng chuẩn không có assertion bị nới lỏng giả tạo.
4. Kết thúc bằng việc mở `reports/fr07-webkit/index.html` và `reports/all-browsers/index.html` xác nhận tem `Run by: 23120285` + ISO timestamp hiển thị rõ ràng.
