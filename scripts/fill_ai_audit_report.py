#!/usr/bin/env python3
"""Fill the official [AI-02] - FIT@HCMUS - AI Audit Report_Vn.docx template for HW04."""

from pathlib import Path
from typing import List, Tuple

import docx
from docx.oxml import OxmlElement
from docx.shared import Pt, RGBColor

ROOT_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = Path(
    "/home/khoa/Documents/Four years/Kiểm thử phần mềm/Homeworks/AI Templates/[AI-02] - FIT@HCMUS - AI Audit Report_Vn.docx"
)
OUT_DOCX = ROOT_DIR / "[AI-02] - FIT@HCMUS - AI Audit Report_Vn.docx"

ARTIFACTS: List[Tuple[str, str, str, str, str]] = [
    (
        "Tool: Antigravity Agent\nPrompt (Commit 4b15ff4): Generate Playwright data-driven spec fr01-register.spec.ts and data/fr01-register.csv using getByLabel locators.",
        "page.getByLabel('Họ Tên'), getByLabel('Email'), getByLabel('Mật khẩu') cho 12 test cases.",
        "INCOMPLETE",
        "AI giả định <label> có thuộc tính for/id nhưng Register.jsx không liên kết htmlFor/id nên locator timeout. Thiếu check HTML5 required & UI (FR-21/22). Tham chiếu: W3C HTML Label Association; ISTQB FL §4.2 Spec-Based Testing.",
        "Thay bằng container locator: page.locator('form div', { has: page.locator('label', { hasText }) }).locator('input'); bổ sung checkValidity() & UI checks (ae7da48).",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit f961b3b): Expand FR-01 dataset to all 29 domain, BVA, and UI compliance test cases matching HW02.",
        "29 dòng CSV trong data/fr01-register.csv; TC-A10 kỳ vọng substring 'chữ số'.",
        "INCOMPLETE",
        "Kiểm thử thực tế trên Chromium/WebKit: Register.jsx hiển thị thông báo '...gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT.' khiến TC-A10 fail sai do khác từ vựng chứ không phải bug. Tham chiếu: ISTQB FL §4.3 BVA/EP.",
        "Chuẩn hóa regex kỳ vọng TC-A10 thành 'chữ số|số' (9a54e00); giữ nguyên fail ở TC-A01..A05, TC-A14..A28 để phơi bày BUG-01..BUG-04.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit 6d9f213): Generate data-driven Playwright spec fr07-cart.spec.ts reading data/fr07-cart.json for FR-07 Shopping Cart.",
        "Sau khi bấm Thêm vào giỏ trên /, script gọi await page.goto('/cart') và dùng expect(body).toContainText('Tổng').",
        "INVALID",
        "CartContext.jsx chỉ lưu giỏ hàng trong React useState (in-memory); gọi page.goto('/cart') làm reload trang, xóa sạch state khiến 13/14 test sai lệch. Ngoài ra toContainText('Tổng') gây false pass trước 'Tổng tạm tính'. Tham chiếu: ISTQB FL §5.2 & React SPA Lifecycle.",
        "Viết lại hoàn toàn ở 25184e9: điều hướng qua SPA link header nav a[href='/cart'], siết assertion chính xác 'Tổng cộng' & cấm 'Tổng tạm tính', kiểm tra nút +/- và confirm dialog.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit 25184e9): Enforce strict FR-07/FR-23/FR-24 contract checks across 14 cart test cases without relaxing bugs.",
        "Kiểm tra đủ 5 cột ('Đơn giá'), hợp nhất dòng trùng, +/- bounds, confirm dialog trước xóa, empty SVG, navbar badge và breadcrumb.",
        "VALID",
        "Mọi assertion bám sát đặc tả FR-07/FR-23/FR-24, không chứa waitForTimeout cứng, chạy ổn định trên Chromium/Firefox/WebKit và bắt chính xác BUG-05, BUG-06, BUG-07 (2 pass, 12 fail đúng bug). Tham chiếu: ISTQB FL §2.3 Functional & UI Testing.",
        "Dùng nguyên logic từ 25184e9; chỉ bổ sung gọi helper annotateTestCase(testInfo, tc) trong commit da94068.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit d8a3a33): Generate initial Playwright spec fr18-admin-orders.spec.ts for Admin Order Management.",
        "Đăng nhập Admin và tìm trực tiếp các dòng trong table tbody tr dựa trên dữ liệu có sẵn.",
        "INVALID",
        "database.js khởi tạo bảng orders rỗng (0 dòng) khi server mới chạy, khiến toàn bộ 4 test smoke đầu tiên fail ở bước tìm đơn hàng do thiếu precondition setup. Tham chiếu: ISTQB FL §3.2 Test Environment & Preconditions.",
        "Tạo tests/helpers/eshop-api.ts (seedOrderWithStatus) tự tạo đơn qua POST /api/checkout và đẩy state nền qua API trước mỗi test (a9e33f2).",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit a9e33f2): Add TC-C14 checking non-admin user blocked from Admin UI login via alert dialog.",
        "Đặt page.once('dialog', d => { seen = true; d.dismiss(); }) và expect(seen).toBe(true) ngay sau click Login.",
        "INCOMPLETE",
        "Trên WebKit Docker, dialog event bắn bất đồng bộ ngay sau click nên kiểm tra biến đồng bộ `seen` bị race condition (fail giả trên WebKit). Tham chiếu: Playwright Event Synchronization Model.",
        "Sửa ở 9a54e00 thành `const dialogPromise = page.waitForEvent('dialog'); await loginBtn.click(); const dialog = await dialogPromise;` — pass ổn định trên cả 3 browser.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit a9e33f2): Add negative transition, terminal state, Stored XSS and RBAC checks for FR-18/FR-10.",
        "Kiểm tra canceled -> delivered (TC-C08), payload <b data-xss-marker><img onerror=...> không được parse thành DOM/chạy JS (TC-C10), và non-admin JWT gọi PUT /api/admin/orders/:id/status phải trả 403 (TC-C11).",
        "VALID",
        "Các assertion API & DOM Security trực tiếp phát hiện 3 lỗ hổng thật của SUT: BUG-08 (canceled -> delivered), BUG-09 (Stored XSS via dangerouslySetInnerHTML), và BUG-10 (thiếu check role==='admin' ở backend trả 200 thay vì 403). Tham chiếu: OWASP Top 10 A01 & A03.",
        "Giữ nguyên 100% assertion chặt; bổ sung ảnh chứng cứ từ HTML report vào docs/bug_report.md và create_github_issues.py.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit da94068): Add Student ID/requirement traceability helper and 9+1 multi-browser matrix runner.",
        "Helper annotateTestCase() trong tests/helpers/data-loader.ts và WEBKIT_WS_ENDPOINT trong playwright.config.ts.",
        "VALID",
        "Tránh lặp code annotation giữa 3 file spec; đồng thời giải quyết lỗi thiếu thư viện libicudata.so.74/libjpeg.so.8 của WebKit native trên Fedora 44 bằng Docker mcr.microsoft.com/playwright:v1.65.0-noble. Tham chiếu: Clean Code / DRY & ISTQB Portable Test Environments.",
        "Dùng nguyên thiết kế helper dùng chung; TypeScript tsc --noEmit pass sạch không cảnh báo.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt (Commit da94068): Render Run by: 23120285 and ISO-8601 timestamp visibly inside Playwright HTML reports.",
        "Cấu hình property metadata: { runBy, timestamp } và html reporter title trong playwright.config.ts.",
        "INCOMPLETE",
        "Playwright v1.65.0 HTML reporter xuất React SPA tĩnh và không hiển thị config.metadata lên giao diện web (kiểm tra DOM thấy vắng '23120285'). Tham chiếu: Tool Output Verification Principles.",
        "Bổ sung hàm stampHtmlReport() trong scripts/run-matrix.mjs chèn banner #hw04-run-stamp + cập nhật <title> vào cả 10 file reports/*/index.html.",
    ),
    (
        "Tool: Antigravity Agent\nPrompt: Create Agent Skill .agents/skills/playwright-ddt-multibrowser/ and bug issue creation script.",
        "SKILL.md (5 phase + 5 non-negotiable rules), assertion-patterns.md, sample-ddt-spec.md, và scripts/create_github_issues.py.",
        "INCOMPLETE",
        "Lần dry-run đầu tiên của create_github_issues.py gặp lỗi NameError tại chuỗi `{item.quantity}` nằm trong Python f-string chưa escape dấu ngoặc nhọn.",
        "Escape `{{item.quantity}}`, kiểm chứng `python3 scripts/create_github_issues.py --dry-run` xuất đúng 10 bugs BUG-01..BUG-10 kèm raw screenshot URL.",
    ),
]

SECTION5_VN = (
    "Qua kiểm chứng 10 artifact ở HW04, AI rất mạnh trong việc dựng cấu trúc Playwright "
    "TypeScript, bộ đọc CSV/JSON và sinh nhanh biến thể BVA/EP cho 57 test cases trên 3 "
    "trình duyệt. Tuy nhiên, AI thường sai ở hai điểm: (1) giả định ngầm cấu trúc DOM hoặc "
    "runtime không có thật (dùng getByLabel khi thiếu htmlFor, gọi page.goto làm mất React "
    "Context state, quên seed database, hoặc race condition dialog trên WebKit); (2) tự viết "
    "assertion lỏng lẻo gây false pass (như toContainText('Tổng')). Khuyến nghị bắt buộc: "
    "luôn kiểm chứng code AI sinh bằng thực thi thật trên SUT, giữ nguyên assertion chặt "
    "khi gặp lỗi hệ thống (BUG-01..BUG-10), và QA phải trực tiếp thiết kế kiểm tra XSS/RBAC "
    "cũng như cô lập dữ liệu đa trình duyệt."
)


def set_cell_text(cell, text: str, bold: bool = False, font_size_pt: float = 9.5, color=None) -> None:
    cell.text = ""
    para = cell.paragraphs[0]
    para.paragraph_format.space_before = Pt(2)
    para.paragraph_format.space_after = Pt(2)
    run = para.add_run(text)
    run.italic = False
    run.bold = bold
    run.font.size = Pt(font_size_pt)
    if color is not None:
        run.font.color.rgb = color


def delete_table_row(table, row_index: int) -> None:
    tr = table.rows[row_index]._tr
    table._tbl.remove(tr)


def set_row_xml_flag(row, tag_name: str) -> None:
    trPr = row._tr.get_or_add_trPr()
    for child in list(trPr):
        if child.tag.endswith(tag_name):
            return
    trPr.append(OxmlElement(f"w:{tag_name}"))


def main() -> None:
    doc = docx.Document(str(TEMPLATE_PATH))

    # Table 0: Student Information
    t0 = doc.tables[0]
    t0_values = {
        1: "HUỲNH ĐĂNG KHOA",
        2: "23120285",
        3: "CQ2023/3 (Khóa 2023)",
        4: "HW#04 — Automation Testing (Playwright Data-Driven Multi-Browser)",
        5: "13/11/2026",
        6: "Antigravity Agent (Gemini / IDE) + Playwright TypeScript + Docker WebKit",
        7: "[X] Có   [ ] Không",
    }
    for row_idx, val in t0_values.items():
        set_cell_text(t0.rows[row_idx].cells[1], val, bold=(row_idx in (1, 2, 4)), font_size_pt=10)

    # Table 1: Remove the two italic sample rows (R1 & R2) so real artifacts start cleanly at row 1..10
    t1 = doc.tables[1]
    delete_table_row(t1, 2)
    delete_table_row(t1, 1)
    while len(t1.rows) - 1 < len(ARTIFACTS):
        t1.add_row()

    set_row_xml_flag(t1.rows[0], "tblHeader")
    set_row_xml_flag(t1.rows[0], "cantSplit")

    verdict_colors = {
        "VALID": RGBColor(0x15, 0x80, 0x3D),
        "INVALID": RGBColor(0xB9, 0x1C, 0x1C),
        "INCOMPLETE": RGBColor(0xB4, 0x53, 0x09),
    }

    for idx, (prompt_col, output_col, verdict, reason_col, fix_col) in enumerate(ARTIFACTS, start=1):
        row = t1.rows[idx]
        set_row_xml_flag(row, "cantSplit")
        set_cell_text(row.cells[0], f"#{idx} — {prompt_col}", font_size_pt=8.5)
        set_cell_text(row.cells[1], output_col, font_size_pt=8.5)
        set_cell_text(row.cells[2], verdict, bold=True, font_size_pt=6.5, color=verdict_colors[verdict])
        set_cell_text(row.cells[3], reason_col, font_size_pt=8.5)
        set_cell_text(row.cells[4], fix_col, font_size_pt=8.5)

    # Table 2: Accuracy Summary
    total = len(ARTIFACTS)
    valid_cnt = sum(1 for a in ARTIFACTS if a[2] == "VALID")
    invalid_cnt = sum(1 for a in ARTIFACTS if a[2] == "INVALID")
    incomplete_cnt = sum(1 for a in ARTIFACTS if a[2] == "INCOMPLETE")

    t2 = doc.tables[2]
    set_cell_text(t2.rows[1].cells[1], str(total), bold=True, font_size_pt=10)
    set_cell_text(t2.rows[1].cells[2], "100%", bold=True, font_size_pt=10)
    set_cell_text(t2.rows[2].cells[1], str(valid_cnt), font_size_pt=10)
    set_cell_text(t2.rows[2].cells[2], f"{valid_cnt * 100 / total:.0f}%", font_size_pt=10)
    set_cell_text(t2.rows[3].cells[1], str(invalid_cnt), font_size_pt=10)
    set_cell_text(t2.rows[3].cells[2], f"{invalid_cnt * 100 / total:.0f}%", font_size_pt=10)
    set_cell_text(t2.rows[4].cells[1], str(incomplete_cnt), font_size_pt=10)
    set_cell_text(t2.rows[4].cells[2], f"{incomplete_cnt * 100 / total:.0f}%", font_size_pt=10)

    # Section 5 (P20..P25 blank lines)
    doc.paragraphs[20].text = SECTION5_VN
    for p_idx in range(21, 26):
        doc.paragraphs[p_idx].text = ""

    # Section 6 Mandatory Disclosure (P27)
    doc.paragraphs[27].text = (
        '"Bộ Playwright test script (fr01-register.spec.ts, fr07-cart.spec.ts, fr18-admin-orders.spec.ts), '
        "dữ liệu CSV/JSON ngoài, script chạy ma trận và báo cáo này được sinh phiên bản đầu với sự hỗ trợ của "
        "Antigravity AI Agent; tôi đã trực tiếp kiểm chứng thực thi trên EShop SUT (Chromium, Firefox, WebKit), "
        "chỉnh sửa các lỗi selector getByLabel, lỗi mất React Context khi goto('/cart'), bổ sung helper "
        "seedOrderWithStatus và sửa race condition dialog WebKit, bổ sung các test bảo mật Stored XSS & RBAC "
        "(TC-C10, TC-C11) và toàn bộ phần AI Critique do tôi tự viết. AI Audit Report chi tiết đính kèm ở Phụ lục A "
        'và AI_LOG.md. Tôi cam đoan không dùng AI để sinh bất kỳ artifact nào thuộc danh mục bị cấm."'
    )

    # Table 3: Signature Table
    t3 = doc.tables[3]
    t3_values = {
        0: "HUỲNH ĐĂNG KHOA",
        1: "23120285",
        2: "CQ2023/3",
        4: "Giảng viên môn CS423 / CSC13003 (FIT@HCMUS)",
        5: "13/11/2026",
        6: "Huỳnh Đăng Khoa",
    }
    for row_idx, val in t3_values.items():
        set_cell_text(t3.rows[row_idx].cells[1], val, bold=(row_idx in (0, 1)), font_size_pt=10)

    doc.save(str(OUT_DOCX))
    wc = len(SECTION5_VN.split())
    print(f"Saved {OUT_DOCX} (Section 5 word count: {wc} words; VALID={valid_cnt}, INVALID={invalid_cnt}, INCOMPLETE={incomplete_cnt})")


if __name__ == "__main__":
    main()
