# HW04 — Data-Driven Multi-Browser Automation Testing (`eshop-sut`)

- **Student:** Huỳnh Đăng Khoa (`23120285`) — Class `CQ2023/3` (FIT@HCMUS)
- **Repository:** `https://github.com/KozKhoa/TestingSoftware-HW04`
- **Frameworks:** Playwright Test (`TypeScript`), `csv-parse`, Node.js Matrix Runner (`9 + 1` HTML reports), Docker WebKit Bridge (`mcr.microsoft.com/playwright:v1.65.0-noble`)

---

## 1. Repository Structure

```text
HW04/
├── .agents/skills/playwright-ddt-multibrowser/   # Section 7 Agent Skill (SKILL.md + resources + examples)
├── data/
│   ├── fr01-register.csv                         # 29 external test cases for FR-01
│   ├── fr07-cart.json                            # 14 external test cases for FR-07
│   └── fr18-admin-orders.json                    # 14 external test cases for FR-18 + FR-10 + Security
├── docs/
│   ├── bug_report.md / bug_report.pdf            # BUG-01..BUG-10 detailed defects
│   ├── screenshots/bugs/                         # 11 PNG failure/API proof screenshots
│   └── video_scripts.md                          # Vietnamese narration scripts for Task 2 & Section 7 videos
├── reports/
│   ├── index.html                                # Master 9+1 dashboard (Run by: 23120285)
│   ├── matrix-summary.json                       # Machine-readable exact pass/fail counts
│   ├── fr{01,07,18}-{chromium,firefox,webkit}/   # 9 individual feature x browser HTML reports
│   └── all-browsers/index.html                   # 1 combined 171-execution multi-browser HTML report
├── scripts/
│   ├── start_sut.sh / stop_sut.sh                # Launch/stop eshop-sut (:3000, :5173, :5174)
│   ├── run-matrix.mjs                            # Runs 9+1 matrix & stamps HTML reports
│   ├── create_github_issues.py                   # Posts BUG-01..BUG-10 to GitHub Issues API
│   ├── fill_ai_audit_report.py                   # Fills official [AI-02] FIT@HCMUS DOCX/PDF
│   └── export_pdfs.mjs                           # Renders GFM Markdown -> A4 PDF via Pandoc + Chromium
├── tests/
│   ├── fr01-register.spec.ts                     # Pool A automation spec (29 TCs)
│   ├── fr07-cart.spec.ts                         # Pool B automation spec (14 TCs)
│   ├── fr18-admin-orders.spec.ts                 # Pool C automation spec (14 TCs)
│   └── helpers/{data-loader.ts,eshop-api.ts}     # CSV/JSON parser, {{UNIQUE}} token, API seeder
├── report.md / report.pdf                        # Main Automation Report
├── AI_CRITIQUE.md / AI_CRITIQUE.pdf              # Critical reflection (strictly 200-300 words)
├── AI_LOG.md                                     # Verbatim AI prompt/response/fix engineering log
├── [AI-02] - FIT@HCMUS - AI Audit Report_Vn.docx / .pdf
├── git_log.txt                                   # Commit history (>= 8 commits modifying .spec.ts)
└── youtube_list.txt                              # Demo video URLs
```

---

## 2. How to Setup & Run

```bash
# 1. Install dependencies & browsers
npm install
npx playwright install chromium firefox webkit

# 2. Start EShop SUT (:3000 backend, :5173 web, :5174 admin)
npm run sut:start

# 3. (Linux non-Ubuntu hosts where native WebKit lacks Ubuntu 24.04 libs)
docker run -d --rm --init --network host mcr.microsoft.com/playwright:v1.65.0-noble \
  npx -y playwright@1.65.0 run-server --port 9321 --host 127.0.0.1

# 4. Run full 9+1 multi-browser matrix & stamp HTML reports
npm run test:matrix

# 5. View combined HTML report
npm run test:report
```

---

## 3. Test Summary Report (`Run by: 23120285`)

Measured from `reports/matrix-summary.json` (generated `2026-11-13T14:48:44.739Z`, **0 flaky tests**, strict assertions retained for all genuine SUT bugs):

| Feature | Browser Engine | Total TCs | Passed | Failed (SUT Bugs) | Duration | HTML Report |
|---|---|---:|---:|---:|---:|---|
| FR-01 Account Registration | Chromium | 29 | 10 | 19 | 52.7s | [fr01-chromium](reports/fr01-chromium/index.html) |
| FR-01 Account Registration | Firefox | 29 | 10 | 19 | 83.9s | [fr01-firefox](reports/fr01-firefox/index.html) |
| FR-01 Account Registration | WebKit | 29 | 10 | 19 | 65.8s | [fr01-webkit](reports/fr01-webkit/index.html) |
| FR-07 Shopping Cart | Chromium | 14 | 2 | 12 | 39.0s | [fr07-chromium](reports/fr07-chromium/index.html) |
| FR-07 Shopping Cart | Firefox | 14 | 2 | 12 | 62.2s | [fr07-firefox](reports/fr07-firefox/index.html) |
| FR-07 Shopping Cart | WebKit | 14 | 2 | 12 | 42.6s | [fr07-webkit](reports/fr07-webkit/index.html) |
| FR-18 Admin Order Mgmt | Chromium | 14 | 11 | 3 | 15.5s | [fr18-chromium](reports/fr18-chromium/index.html) |
| FR-18 Admin Order Mgmt | Firefox | 14 | 11 | 3 | 23.1s | [fr18-firefox](reports/fr18-firefox/index.html) |
| FR-18 Admin Order Mgmt | WebKit | 14 | 11 | 3 | 19.9s | [fr18-webkit](reports/fr18-webkit/index.html) |
| **Combined All-Browsers** | **Chromium, Firefox, WebKit** | **171** | **69** | **102** | **405.6s** | [all-browsers](reports/all-browsers/index.html) |

---

## 4. Demo Videos (YouTube)

Recording guides are prepared in [docs/video_scripts.md](docs/video_scripts.md):
- **Task 2 Automation Demo (>= 5 min, Vietnamese):** `[LINK_PENDING]`
- **Section 7 Agent Skill E2E Demo:** `[LINK_PENDING]`

---

## 5. Self-Assessment Table (HW04 Section 15)

| Section / Deliverable | Max Weight | Current Status | Notes & Evidence |
|---|---:|---:|---|
| 1. Multi-Browser Execution (`Chromium`, `Firefox`, `WebKit`) + Stamped HTML Reports | 20% | **20%** | 9 individual + 1 combined HTML report visibly stamped `Run by: 23120285` + ISO-8601 timestamp (`reports/index.html`) |
| 2. Data-Driven Playwright Suites (`>= 12` TCs × 3 features, external CSV/JSON, `>= 3` assertions, `>= 8` `.spec.ts` commits) | 25% | **25%** | `29 + 14 + 14 = 57` TCs in `data/`; 9 commits changing `.spec.ts` (`git_log.txt`); 5 assertion patterns |
| 3. AI Gap Analysis, `report.md/.pdf`, `AI_LOG.md`, `[AI-02]` & `AI_CRITIQUE` (200–300w) | 25% | **25%** | Complete commit-by-commit analysis in `report.md`; `AI_CRITIQUE.md` verified at 268 words; `[AI-02]` DOCX+PDF verified |
| 4. Bug Report & GitHub Issues (`BUG-01..BUG-10` + screenshots) | 15% | **15%** | `docs/bug_report.md/.pdf`, 11 PNG screenshots & all 10 live Issues posted (`#1`–`#10` at `https://github.com/KozKhoa/TestingSoftware-HW04/issues`) |
| 5. Agent Skill (`.agents/skills/playwright-ddt-multibrowser/`) + Task 2 & Skill Videos + Submission Archive | 15% | **5%** | Skill bundle + Vietnamese recording scripts ready (`docs/video_scripts.md`); pending user recording/upload of the 2 YouTube videos + `.zip` rename |
| **Current Verified Subtotal** | **100%** | **90%** | Reaches **100%** immediately once user records videos, inserts YouTube links & exports PDFs/archive |
