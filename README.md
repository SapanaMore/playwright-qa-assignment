# Playwright QA Assignment — Restful-Booker Platform

## Overview

Comprehensive QA automation suite for the [Restful-Booker Platform](https://automationintesting.online), a Bed & Breakfast booking system built for testing practice. The suite covers **API testing** (auth, booking, room, message, branding) and **UI testing** (booking flow, contact form, admin panel) using **Playwright** with **TypeScript** and the **Page Object Model** pattern.

## Tech Stack

| Technology | Purpose |
|---|---|
| [Playwright](https://playwright.dev/) | Test framework — API + browser automation |
| TypeScript | Type-safe test code |
| Page Object Model (POM) | UI test architecture |
| GitHub Actions | CI/CD pipeline |
| GitHub Pages | Published HTML report |
| dotenv | Environment variable management |

## Project Structure

```
.
├── .github/workflows/        # CI/CD — GitHub Actions
│   └── playwright.yml
├── artifacts/
│   └── manual-test-cases.csv # Part A — manual test case document
├── src/
│   ├── api/
│   │   └── AuthHelper.ts     # Token caching & auth cookie helper
│   ├── pages/
│   │   ├── BasePage.ts       # Abstract base page
│   │   ├── AdminLoginPage.ts # Admin login POM
│   │   ├── AdminDashboardPage.ts # Admin dashboard POM
│   │   └── HomePage.ts       # Public homepage POM (booking + contact)
│   └── utils/
│       └── TestDataGenerator.ts # Random test data factory
├── tests/
│   ├── api/
│   │   ├── auth.api.spec.ts      # Auth endpoint tests
│   │   ├── booking.api.spec.ts   # Booking CRUD tests
│   │   ├── room.api.spec.ts      # Room CRUD tests
│   │   ├── message.api.spec.ts   # Message API tests
│   │   └── branding.api.spec.ts  # Branding API tests
│   └── ui/
│       ├── public.ui.spec.ts     # Homepage, booking, contact tests
│       └── admin.ui.spec.ts      # Admin login, rooms, session tests
├── playwright.config.ts      # Playwright config (API + UI projects)
├── .env.example              # Environment variable template
└── package.json
```

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/playwright-qa-assignment.git
cd playwright-qa-assignment

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install chromium --with-deps

# 4. Copy environment config
cp .env.example .env
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `BASE_URL` | Web UI base URL | `https://automationintesting.online` |
| `BASE_API_URL` | API base URL (with `/api/` prefix) | `https://automationintesting.online/api/` |
| `STANDALONE_API_URL` | Standalone booking API | `https://restful-booker.herokuapp.com` |
| `ADMIN_USER` | Admin username | `admin` |
| `ADMIN_PASS` | Admin password | `password` |

> **Note:** In CI, these are stored as GitHub Secrets (`ADMIN_USER`, `ADMIN_PASS`, `BASE_URL`, `BASE_API_URL`).

## Running Tests Locally

```bash
# Run all tests (API + UI)
npm test

# Run only API tests
npm run test:api

# Run only UI tests
npm run test:ui

# Open the HTML report
npm run report
```

## CI/CD — GitHub Actions

The workflow (`.github/workflows/playwright.yml`) triggers on:
- **Push** to `main` / `master`
- **Pull request** to `main` / `master`
- **Manual** via `workflow_dispatch`

### Pipeline Steps
1. Checkout code
2. Install Node.js 20 + npm dependencies
3. Install Playwright Chromium browser
4. Run API tests
5. Run UI tests
6. Upload Playwright HTML report as artifact (30-day retention)
7. Deploy report to GitHub Pages

### Where to Find the Report
- **Artifact:** Go to Actions → select the workflow run → download `playwright-report` artifact
- **GitHub Pages:** `https://<your-username>.github.io/playwright-qa-assignment/`

## Test Coverage Summary

### API Tests

| Module | Tests | Scenarios |
|---|---|---|
| Auth | 3 | Valid login, invalid credentials, empty body |
| Booking — Read | 3 | GET all, GET by ID, invalid ID 404 |
| Booking — CRUD | 5 | POST valid, POST missing field, POST invalid dates, PUT with/without token, DELETE with/without token |
| Room | 7 | GET all, POST/PUT/DELETE with token, POST/PUT/DELETE without token |
| Message | 6 | POST guest message, GET list, GET by ID, DELETE with token, GET without token, DELETE without token |
| Branding | 3 | GET fields, PUT with token, PUT without token |
| **Total** | **27** | |

### UI Tests

| Module | Tests | Scenarios |
|---|---|---|
| Homepage & Booking | 4 | Page load, happy path booking, empty form, partial form |
| Contact Form | 4 | Valid submit, empty submit, special characters, max length |
| Admin Login | 4 | Valid login, invalid login, empty fields, password masking |
| Admin Rooms | 2 | Create + delete room, delete room |
| Admin Session | 2 | Report navigation, logout + redirect |
| **Total** | **16** | |

### Manual Test Cases

| Location | Count |
|---|---|
| `artifacts/manual-test-cases.csv` | 25 test cases |

Covers: Auth API, Booking API, Room API, Message API, Branding API, UI Frontend (booking + contact), UI Admin Panel (login, rooms, session).

## Known Issues

- The platform resets data periodically — tests are written to be fully independent and create/clean up their own data.
- `automationintesting.online` can experience intermittent latency; the auth helper includes retry logic with exponential backoff.
- Calendar date selection uses mouse drag which can be timing-sensitive in CI environments.
