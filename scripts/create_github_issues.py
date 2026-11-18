#!/usr/bin/env python3
"""Create GitHub Issues for all verified SUT bugs discovered in HW04 automation runs."""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import requests

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_args: Any, **_kwargs: Any) -> bool:
        return False

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

DEFAULT_REPO = "KozKhoa/TestingSoftware-HW04"


def build_bugs_payload(repo: str, branch: str = "main") -> List[Dict[str, Any]]:
    raw_base = f"https://raw.githubusercontent.com/{repo}/{branch}/docs/screenshots/bugs"
    return [
        {
            "bug_id": "BUG-01",
            "title": "[BUG-01][FR-01][Critical] Password regex requires whitespace and rejects special characters (@$!%*?&)",
            "labels": ["bug", "severity:critical", "feature:FR-01", "automation-verified"],
            "body": f"""### Summary
Account registration on `/register` rejects valid strong passwords containing standard special characters (such as `@`, `$`, `!`, `%`, `*`, `?`, `&`) whenever no whitespace is present, blocking `TC-A01..TC-A05`.

### Environment & Verification
- **SUT Component:** `frontend-web/src/pages/Register.jsx` (`flawedStrongPasswordRegex`)
- **Automated Evidence:** `tests/fr01-register.spec.ts` (`TC-A01`, `TC-A02`, `TC-A03`, `TC-A04`, `TC-A05`)
- **Browsers Tested:** Chromium, Firefox, WebKit (100% reproducible across all 3 engines)

### Root Cause
`Register.jsx` uses `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\s)[A-Za-z\\d\\s]{{8,}}$/` which enforces `(?=.*\\s)` (whitespace) instead of allowed special characters `(?=.*[@$!%*?&])`.

### Steps to Reproduce
1. Navigate to `http://localhost:5173/register`.
2. Fill Name `Nguyen Van A`, Email `valid_user01@eshop.com`, Password `ValidP@ss123`.
3. Click `Đăng Ký`.

### Expected vs Actual
- **Expected:** Account is created and user redirects to `/login`.
- **Actual:** Red error banner `.bg-red-100` appears: *"Mật khẩu quá yếu! Phải dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT."*

### Evidence
![BUG-01 FR-01 Password Regex Rejection]({raw_base}/bug-01-fr01-password-regex.png)
""",
        },
        {
            "bug_id": "BUG-02",
            "title": "[BUG-02][FR-01][Major] Registration form omits mandatory Confirm Password field",
            "labels": ["bug", "severity:major", "feature:FR-01", "automation-verified"],
            "body": f"""### Summary
The `/register` form completely lacks the Confirm Password (`Xác nhận mật khẩu`) input field required by `FR-01`, allowing typo mistakes and failing `TC-A23`, `TC-A24`, and `TC-A27`.

### Automated Evidence
- **Spec & Cases:** `tests/fr01-register.spec.ts` (`TC-A23`, `TC-A24`, `TC-A27`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Expected vs Actual
- **Expected:** Second `input[type="password"]` field exists and validates password match before submission.
- **Actual:** Only 1 password input renders (`locator('form input[type="password"]').nth(1)` is absent).

### Evidence
![BUG-02 Missing Confirm Password]({raw_base}/bug-02-fr01-missing-confirm-password.png)
""",
        },
        {
            "bug_id": "BUG-03",
            "title": "[BUG-03][FR-01][FR-21/FR-22][Minor] UI guideline violations: missing * markers, Email type='text', red Submit button",
            "labels": ["bug", "severity:minor", "feature:FR-01", "ui-compliance", "automation-verified"],
            "body": f"""### Summary
`/register` violates UI guidelines (`FR-21`, `FR-22`):
1. Labels (`Họ Tên`, `Email`, `Mật khẩu`) lack `*` mandatory indicator (`TC-A25`).
2. Email input uses `type="text"` instead of `type="email"` (`TC-A26`).
3. Submit button `Đăng Ký` uses `bg-red-500` instead of brand blue `bg-blue-*` (`TC-A28`).

### Automated Evidence
- **Spec & Cases:** `tests/fr01-register.spec.ts` (`TC-A25`, `TC-A26`, `TC-A28`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-03 FR-01 UI Compliance Violations]({raw_base}/bug-03-fr01-ui-compliance.png)
""",
        },
        {
            "bug_id": "BUG-04",
            "title": "[BUG-04][FR-01][Major] Missing Name/Email validation & duplicate feedback masked by flawed password check (plus plaintext password DB storage)",
            "labels": ["bug", "severity:major", "feature:FR-01", "security", "automation-verified"],
            "body": f"""### Summary
1. Whitespace-only Name (`TC-A14`), Name > 255 chars (`TC-A15`), invalid Email formats (`TC-A17..TC-A21`), and duplicate email `test@eshop.com` (`TC-A22`) are never validated properly on client/server — `.bg-red-100` surfaces the broken password error or backend accepts arbitrary values without email format/length checks.
2. **Security Audit (`SEC-01`):** `backend/server.js` inserts `password` verbatim into SQLite `users` table without bcrypt/argon2 hashing.

### Automated Evidence
- **Spec & Cases:** `tests/fr01-register.spec.ts` (`TC-A14`, `TC-A15`, `TC-A17..TC-A22`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-04 Validation Masking]({raw_base}/bug-04-fr01-validation-masking.png)
""",
        },
        {
            "bug_id": "BUG-05",
            "title": "[BUG-05][FR-07][Major] Adding the same product multiple times creates duplicate rows instead of incrementing quantity",
            "labels": ["bug", "severity:major", "feature:FR-07", "automation-verified"],
            "body": f"""### Summary
Adding `"iPhone 15 Pro Max"` twice on `/` creates **2 separate rows** (`qty=1` each) in `/cart` instead of 1 merged row (`qty=2`).

### Root Cause
`frontend-web/src/context/CartContext.jsx` executes `setCart([...cart, {{ ...product, quantity: 1 }}])` unconditionally without checking existing `product.id`.

### Automated Evidence
- **Spec & Case:** `tests/fr07-cart.spec.ts` (`TC-B03`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-05 Duplicate Cart Row]({raw_base}/bug-05-fr07-duplicate-row.png)
""",
        },
        {
            "bug_id": "BUG-06",
            "title": "[BUG-06][FR-07][Major] Cart missing +/- quantity controls, immediate deletion without confirm dialog, and wrong 'Giá' column header",
            "labels": ["bug", "severity:major", "feature:FR-07", "automation-verified"],
            "body": f"""### Summary
1. Table column 2 displays `"Giá"` instead of specified `"Đơn giá"` (`TC-B02`).
2. Quantity cell renders static text `{{item.quantity}}` with zero `+` / `-` buttons or lower-boundary protection (`TC-B02`, `TC-B04`, `TC-B05`, `TC-B06`).
3. Clicking `Xóa` removes the item immediately without any confirmation modal or `window.confirm` dialog (`TC-B07`, `TC-B09`).

### Automated Evidence
- **Spec & Cases:** `tests/fr07-cart.spec.ts` (`TC-B02`, `TC-B04`, `TC-B05`, `TC-B06`, `TC-B07`, `TC-B09`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-06 Cart Missing Controls]({raw_base}/bug-06-fr07-missing-controls.png)
""",
        },
        {
            "bug_id": "BUG-07",
            "title": "[BUG-07][FR-07][FR-23/FR-24][Minor] Cart wrong labels ('Tổng tạm tính', '← Mua tiếp'), missing empty illustration, navbar badge, and breadcrumb",
            "labels": ["bug", "severity:minor", "feature:FR-07", "ui-compliance", "automation-verified"],
            "body": f"""### Summary
Multiple `FR-07`, `FR-23`, and `FR-24` UI contract mismatches verified in `Cart.jsx` and `Navbar`:
- Total summary renders `"Tổng tạm tính"` instead of `"Tổng cộng"` (`TC-B10`).
- Continue shopping link renders `"← Mua tiếp"` instead of `"Tiếp tục mua sắm"` (`TC-B12`).
- Empty cart view lacks SVG/image illustration (`TC-B01`).
- Navbar `Giỏ hàng` link displays no dynamic quantity badge (`TC-B13`).
- `/cart` page omits navigation breadcrumb (`TC-B14`).

### Automated Evidence
- **Spec & Cases:** `tests/fr07-cart.spec.ts` (`TC-B01`, `TC-B10`, `TC-B12`, `TC-B13`, `TC-B14`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-07 Cart Labels and Empty State]({raw_base}/bug-07-fr07-labels-ui.png)
""",
        },
        {
            "bug_id": "BUG-08",
            "title": "[BUG-08][FR-18][FR-10][Major] Terminal 'canceled' orders still allow invalid transition to 'delivered' in Admin UI and API",
            "labels": ["bug", "severity:major", "feature:FR-18", "state-machine", "automation-verified"],
            "body": f"""### Summary
In violation of `FR-10` State Machine rules (`canceled` is a terminal state), Admin Dashboard renders `"Đánh dấu Đã giao"` button on `canceled` rows and `PUT /api/admin/orders/:id/status` accepts `{{"status":"delivered"}}` with HTTP `200` instead of `400`.

### Root Cause
- `frontend-admin/src/App.jsx` explicitly renders the override button when `order.status === 'canceled'`.
- `backend/server.js` allows `canceled: ['delivered']` in `VALID_TRANSITIONS`.

### Automated Evidence
- **Spec & Case:** `tests/fr18-admin-orders.spec.ts` (`TC-C08`)
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-08 Canceled to Delivered]({raw_base}/bug-08-fr18-canceled-to-delivered.png)
""",
        },
        {
            "bug_id": "BUG-09",
            "title": "[BUG-09][FR-18][SEC-04][Critical] Stored XSS in Admin Orders table via dangerouslySetInnerHTML on shipping_address",
            "labels": ["bug", "severity:critical", "feature:FR-18", "security", "xss", "automation-verified"],
            "body": f"""### Summary
`frontend-admin/src/App.jsx` renders customer `shipping_address` with React's `dangerouslySetInnerHTML={{{{ __html: order.shipping_address }}}}`, parsing raw HTML tags (`<b>`) and executing inline JavaScript event handlers (`<img src=x onerror=...>`) in the authenticated Admin browser.

### Automated Evidence
- **Spec & Case:** `tests/fr18-admin-orders.spec.ts` (`TC-C10`)
- **Assertion:** `addressCell.locator('b[data-xss-marker], img')` returned count `2` instead of `0`, and `window.__xssHits[nonce]` was evaluated as `true`.
- **Browsers Tested:** Chromium, Firefox, WebKit

### Evidence
![BUG-09 Stored XSS in Admin Orders]({raw_base}/bug-09-fr18-stored-xss.png)
""",
        },
        {
            "bug_id": "BUG-10",
            "title": "[BUG-10][FR-18][SEC-03][Critical] Missing role='admin' RBAC guard on /api/admin/orders/* allows any regular user token to mutate order statuses",
            "labels": ["bug", "severity:critical", "feature:FR-18", "security", "rbac", "automation-verified"],
            "body": f"""### Summary
Discovered during human security review when writing `fr18-admin-orders.spec.ts`: `backend/server.js` (`GET /api/admin/orders` and `PUT /api/admin/orders/:id/status`) only attaches `authenticateToken` middleware and never verifies `req.user.role === 'admin'`. A standard customer JWT (`test@eshop.com`) succeeds with HTTP `200` when calling `PUT /api/admin/orders/:id/status` instead of `403 Forbidden`.

### Automated Evidence
- **Spec & Case:** `tests/fr18-admin-orders.spec.ts` (`TC-C11`)
- **Expected:** HTTP `403` | **Actual:** HTTP `200`

### Evidence
![BUG-10 Missing Admin RBAC]({raw_base}/bug-10-fr18-missing-rbac.png)
""",
        },
    ]


def ensure_label(session: requests.Session, api_base: str, label: str) -> None:
    color_map = {
        "bug": "d73a4a",
        "severity:critical": "b60205",
        "severity:major": "d93f0b",
        "severity:minor": "fbca04",
        "security": "5319e7",
        "xss": "b60205",
        "rbac": "5319e7",
        "automation-verified": "0e8a16",
    }
    resp = session.get(f"{api_base}/labels/{requests.utils.quote(label, safe='')}")
    if resp.status_code == 200:
        return
    session.post(
        f"{api_base}/labels",
        json={"name": label, "color": color_map.get(label, "1d76db")},
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Create GitHub Issues for HW04 SUT bugs.")
    parser.add_argument("--dry-run", action="store_true", help="Print issues without calling GitHub API.")
    parser.add_argument("--repo", default=os.getenv("GITHUB_REPO", DEFAULT_REPO), help="owner/repo slug.")
    args = parser.parse_args()

    bugs = build_bugs_payload(args.repo)
    if args.dry_run:
        for b in bugs:
            print(f"[DRY-RUN] {b['bug_id']}: {b['title']} | labels={b['labels']}")
        print(f"Total issues prepared: {len(bugs)}")
        return 0

    token = os.getenv("GITHUB_TOKEN", "").strip()
    if not token or token == "ghp_your_token_here":
        print("ERROR: Missing valid GITHUB_TOKEN in environment or .env", file=sys.stderr)
        return 1

    session = requests.Session()
    session.headers.update(
        {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
    )

    api_base = f"https://api.github.com/repos/{args.repo}"
    repo_check = session.get(api_base)
    if repo_check.status_code != 200:
        print(f"ERROR: Cannot access {args.repo} (HTTP {repo_check.status_code}): {repo_check.text}", file=sys.stderr)
        return 1

    existing_resp = session.get(f"{api_base}/issues?state=all&per_page=100")
    existing_titles = {item["title"] for item in existing_resp.json()} if existing_resp.status_code == 200 else set()

    created_urls = []
    for bug in bugs:
        if bug["title"] in existing_titles:
            print(f"SKIP existing issue: {bug['title']}")
            continue
        for lbl in bug["labels"]:
            ensure_label(session, api_base, lbl)
        res = session.post(
            f"{api_base}/issues",
            json={"title": bug["title"], "body": bug["body"], "labels": bug["labels"]},
        )
        if res.status_code == 201:
            data = res.json()
            print(f"CREATED #{data['number']}: {data['html_url']}")
            created_urls.append((bug["bug_id"], data["number"], data["html_url"]))
        else:
            print(f"FAILED {bug['bug_id']} (HTTP {res.status_code}): {res.text}", file=sys.stderr)
        time.sleep(0.4)

    print(f"\nDone. Created {len(created_urls)} new GitHub issue(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
