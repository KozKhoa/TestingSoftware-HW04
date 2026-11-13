# Quy định và Format Commit cho AI Agent (Antigravity & AI Coding Assistants)

Tài liệu này định nghĩa quy chuẩn bắt buộc khi tự động tạo commit message cho dự án **TestingSoftware-HW04**. Mọi AI Agent (Antigravity, Copilot, Cursor...) khi thực hiện commit mã nguồn phải tuân thủ nghiêm ngặt các quy tắc sau.

---

## 1. Cấu trúc Commit Message (Conventional Commits)

Format chuẩn:

```text
<type>(<scope>): <mô tả ngắn gọn>
```

Ví dụ hợp lệ:

- `feat(pact): add consumer test for order service`
- `feat(pact): add provider verification with state handlers`
- `test(pact): add breaking change simulation script`
- `docs(pact): add architecture and video recording guide in readme`
- `feat(postman): create eshop api collection with checkpoints`
- `test(playwright): implement ai-generated api tests for products`
- `fix(backend): support alias route for orders endpoint`
- `chore(config): configure git commit instructions for ai agents`

---

## 2. Quy tắc chi tiết từng phần

### 2.1. `<type>` (Bắt buộc)

Chỉ sử dụng các loại sau (viết thường hoàn toàn):

- `feat`: Thêm tính năng mới, tạo test suite mới, thêm kịch bản kiểm thử mới.
- `test`: Thêm hoặc chỉnh sửa test case, bổ sung assertions, test scripts.
- `fix`: Sửa lỗi trong code, fix bug test case hoặc sửa route backend.
- `docs`: Cập nhật tài liệu (`README.md`, tài liệu tuần trong `docs/`, `task/`).
- `refactor`: Tái cấu trúc code test hoặc code SUT mà không thay đổi logic.
- `chore`: Cấu hình dự án, cập nhật `.gitignore`, cài đặt dependencies, script CI/CD.

### 2.2. `<scope>` (Bắt buộc)

Chỉ định rõ phạm vi thay đổi:

- `setup`: Cấu hình dự án, scripts khởi chạy SUT, config Playwright.
- `fr01`: Test suite & dữ liệu CSV cho Feature A (FR-01 Đăng ký tài khoản).
- `fr07`: Test suite & dữ liệu JSON cho Feature B (FR-07 Giỏ hàng Web).
- `fr18`: Test suite & dữ liệu JSON cho Feature C (FR-18 Quản lý Đơn hàng Admin).
- `cross-browser`: Cải thiện tương thích đa trình duyệt (Chromium, Firefox, WebKit).
- `reports`: Cấu hình xuất HTML reports, metadata `Run by: 23120285`, ảnh lỗi.
- `ai-skill`: Bộ kỹ năng Agent Skill `.agents/skills/playwright-ddt-multibrowser/`.
- `docs`: Báo cáo chính, bug report, AI Critique, AI Audit Report, video scripts.

### 2.3. `<mô tả ngắn gọn>` (Subject)

- Sử dụng thể mệnh lệnh ở thì hiện tại (ví dụ: `add`, `implement`, `fix`, `update`, không dùng `added`, `fixes`).
- Viết chữ thường (lowercase) ở đầu câu mô tả.
- Không thêm dấu chấm `.` ở cuối dòng commit message.
- Ngắn gọn, súc tích (dưới 100 ký tự).

---

## 3. Quy tắc an toàn trước khi commit (Pre-commit Checklist)

AI Agent khi tạo commit phải đảm bảo:

1. **Không commit file rác / dependencies**: Tuyệt đối không commit `node_modules/`, cache, log tạm thời, `.env`.
2. **Không commit symlink hoặc file CSDL SQLite cục bộ**: `eshop-sut` và `eshop-sut/backend/database.sqlite` phải được ignore trong `.gitignore`.
3. **Commit theo từng bước (Atomic commits)**: Tách riêng các bước sinh code AI ban đầu, rà soát/sửa lỗi con người, mở rộng biên và ổn định đa trình duyệt (đảm bảo tối thiểu 8 commits thay đổi file `.spec.ts`).

---

## 4. Quy định ghi nhật ký AI (AI Usage Logging - `AI_LOG.md`)

Sau khi hoàn thành bất kỳ task nào, AI Agent **bắt buộc** phải ghi lại nhật ký chi tiết vào file `AI_LOG.md` ở thư mục gốc bao gồm cả plan mà agent đã lên và comment của người dùng (nêu có).

### 4.1. Cấu trúc một bản ghi (Entry Format)

Mỗi bản ghi phải tuân theo cấu trúc chuẩn sau:

````markdown
## [Entry - <YYYY-MM-DD HH:mm:ss>] <Tiêu đề ngắn về task>

- **Timestamp:** `<Thời gian thực thi, định dạng YYYY-MM-DD HH:mm:ss>`
- **User / Prompter:** `<Tên hoặc GitHub Username của người prompt, ví dụ: KozKhoa (@kozkhoa)>`
- **Tools:** `<Tên AI Agent, Model LLM, và công cụ/extensions đã dùng, ví dụ: Antigravity (Gemini 3.8 Flash), GitHub Copilot...>`
- **Description:** `<Tóm tắt ngắn gọn các file và logic mã nguồn đã chỉnh sửa/tạo mới>`

### 1. Prompt (Nguyên văn)

> [!NOTE] Prompt gốc từ người dùng (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)

```text
<Toàn bộ nội dung prompt gốc của người dùng>
```
````

### 2. AI Response (Nguyên văn)

> [!NOTE] Phản hồi gốc từ AI (Không chỉnh sửa, không tóm tắt, giữ nguyên 100%)
> _(Lưu ý: Bắt buộc bọc trong block 4 dấu backticks `markdown ... ` để bảo toàn định dạng Markdown và các code blocks bên trong mà không bị lỗi render)_

```markdown
<Toàn bộ nội dung response nguyên văn của AI>
```

---

`````

### 4.2. Quy tắc bắt buộc khi ghi log
1. **Tuyệt đối trung thực và nguyên văn:** Không được cắt bớt, không lược dịch, không tóm tắt nội dung của mục `Prompt` và `AI Response`.
2. **Bảo toàn định dạng Markdown:** Sử dụng khối 4 dấu backticks (````markdown ... ````) để bọc mục `AI Response`.
3. **Thứ tự ghi:** Bản ghi mới nhất được nối vào cuối file `AI_LOG.md` (hoặc xếp theo thứ tự thời gian tăng dần), cách nhau bởi đường phân cách `---`.


`````
