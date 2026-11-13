---
name: playwright-ddt-multibrowser
description: >
  Applies a disciplined, step-by-step workflow for generating, reviewing, and maintaining
  data-driven, multi-browser Playwright automation suites in TypeScript. Use whenever converting
  manual test cases or feature specs into automated web E2E tests across Chromium, Firefox,
  and WebKit with external CSV/JSON test data, multi-pattern assertions, human adversarial review,
  and traceable HTML reports containing Student ID and ISO-8601 timestamps.
---

# Playwright Data-Driven & Multi-Browser Automation Skill

## Overview

This skill enforces a **human-in-the-loop, AI-first automation engineering workflow**. Instead of prompting an LLM once with "write all automation tests for this feature" (which produces hardcoded test arrays, fragile selectors, lax assertions, and false passes), the tester drives AI step by step through five deterministic phases:

1. **SUT Inspection & Contract Mapping** — inspect the actual UI components, routes, state management, and backend APIs before writing selectors.
2. **External Dataset Extraction (`.csv` / `.json`)** — separate all test inputs and expected outcomes from code (`data/<feature>.csv` or `.json`), with `{{UNIQUE}}` tokens for cross-browser test isolation.
3. **Initial Script Generation** — generate TypeScript Playwright specs (`tests/<feature>.spec.ts`) dynamically loading external data and applying **at least 3 distinct assertion patterns**.
4. **Human Adversarial Review & Hardening** — systematically audit the AI draft for fragile selectors, SPA state resets, lax assertions, race conditions on `dialog` listeners, and missing negative/security/boundary checks. **Never relax an assertion to hide a genuine SUT defect.**
5. **Multi-Browser Matrix Execution & Traceable Reporting** — execute every feature across at least 3 browsers (`chromium`, `firefox`, `webkit`), generate individual and combined HTML reports stamped with `Run by: <StudentID>` and an ISO-8601 timestamp, and document every failing assertion that exposes a real bug.

---

## Core Rules (Non-Negotiable)

1. **Zero Hardcoded Test Datasets in Specs:** All test cases (inputs, edge values, expected messages/statuses) MUST live in external `.csv` or `.json` files under `data/`. Inline arrays/objects of test cases inside `.spec.ts` are prohibited.
2. **At Least 3 Distinct Assertion Patterns per Suite:** Every feature spec must combine multiple verification axes — e.g.:
   - **Navigation / URL assertions:** `expect(page).toHaveURL(...)`
   - **Content / Visibility assertions:** `expect(locator).toBeVisible()`, `toHaveText()`, `toContainText()`
   - **DOM Attribute / Style / Count / State assertions:** `toHaveAttribute(...)`, `toHaveClass(...)`, `toHaveCSS(...)`, `toBeDisabled()`, `toHaveCount(...)`
   - **API / Network / Dialog / Security assertions:** `expect(response.status()).toBe(...)`, `page.on('dialog', ...)`, DOM XSS element count `expect(page.locator(...)).toHaveCount(0)`
3. **Cross-Browser Idempotency:** Tests run across 3 browsers sequentially or in parallel against shared state. Dynamic resources (new user emails, order addresses) must interpolate unique suffixes (`Date.now()`, `testInfo.project.name`, random ID) at runtime from template tokens in CSV/JSON.
4. **Strict Defect Preservation:** When a strict spec-driven assertion fails because the SUT violates the specification (e.g., wrong button color, missing confirmation dialog, allowed invalid state transition, Stored XSS), **keep the assertion failing**, capture screenshot evidence, and file a bug report.
5. **Traceable Execution Metadata:** Every HTML report must visibly render `Run by: <StudentID>` and an ISO-8601 timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## Step-by-Step Execution Workflow

### Step 1 — Inspect Feature Scope & Runtime Mechanics
Before generating tests for feature `<FR-XX>`:
- Identify target UI route(s), form fields, client-side validation rules, API endpoints, and state persistence mechanism (e.g., React Context in-memory vs `localStorage` vs backend DB).
- Record exact specification constraints (required `*` markers, input `type` attributes, button colors, exact Vietnamese/English labels, state machine transition rules, security sanitization rules).

### Step 2 — Build External Test Data (`data/<feature>.csv` or `.json`)
- Map each manual test case (`TC-ID`, `category`: positive/negative/edge/ui/security, inputs, `expectedType`, `expectedDetail`, `reqRef`).
- For unique values (e.g. emails, order tags), use placeholders like `valid_{{UNIQUE}}@eshop.com` so the spec replaces `{{UNIQUE}}` per browser run.
- Verify no defect masking: every negative case isolates a single invalid input while keeping all other fields nominally valid.

### Step 3 — Generate Initial Data-Driven Spec (`tests/<feature>.spec.ts`)
- Parse external CSV/JSON synchronously at module load time (`csv-parse/sync` or `JSON.parse(fs.readFileSync(...))`) so Playwright registers one `test(...)` per row (`${row.tcId} - ${row.description}`).
- Commit the initial AI-generated version cleanly to Git (`feat(<scope>): generate initial ai data-driven spec`).

### Step 4 — Execute, Audit & Fix (Human Review Loop)
Run the initial spec on the live SUT across browsers and critically review failures into two buckets:
- **Script / AI Bugs (Fix in spec/helpers):**
  - *Fragile selectors:* Replace positional XPath or CSS-only chains (`div > div:nth-child(3)`) with semantic role/label/text locators (`getByRole`, `getByLabel`, `locator('tr', { hasText })`).
  - *SPA state wipes:* Never use `page.goto('/cart')` when state is stored in React Context; click the navigation `<Link>` instead.
  - *Flaky timing / dialogs:* Register `page.once('dialog', ...)` **before** clicking buttons; wait for API responses (`page.waitForResponse`) instead of `waitForTimeout`.
  - *Browser-specific quirks:* Verify HTML5 native validation (`validationMessage` / `:invalid` pseudo-class) vs custom error div rendering across Chromium, Firefox, and WebKit.
  - *Lax assertions:* Tighten `toContainText('Tổng')` to exact `toContainText('Tổng cộng')`; verify DOM absence of parsed XSS tags (`toHaveCount(0)`).
- **Genuine SUT Defects (Keep failing + Capture Evidence):**
  - Save failure screenshots under `docs/screenshots/bugs/` and map each failed TC ID to a formal Bug Report + GitHub Issue.
- Commit human review fixes cleanly (`fix(<scope>): ...`) so Git history documents the iterative review.

### Step 5 — Multi-Browser Matrix & Stamped HTML Reports
Execute the full matrix (`3 features × 3 browsers = 9 individual runs` + `1 combined multi-browser run`):
- Stamp Playwright HTML report `metadata` and visible report banner/title with:
  - `Run by: <StudentID>`
  - `Timestamp: <ISO-8601>`
  - `Browser: <chromium|firefox|webkit>`
  - `Feature: <feature-id>`
- Archive all reports under `reports/` and summarize pass/fail counts accurately without fabrications.

→ See [`resources/assertion-patterns.md`](resources/assertion-patterns.md) for reusable assertion patterns and [`examples/sample-ddt-spec.md`](examples/sample-ddt-spec.md) for a complete before/after review example.
