# Alert Console — Real-Time Operations Dashboard

> A high-performance, accessible operations dashboard engineered with **Angular 21**, **TypeScript**, and **Angular Signals**.

[![Angular](https://img.shields.io/badge/Angular-21.2.0-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-47%20Passed%20(100%25)-FCC72B?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Bundle Size](https://img.shields.io/badge/Bundle-54.8%20kB%20gzipped-brightgreen?style=flat-square)](#-performance--bundle)

---

## 📖 Overview

The **Alert Console** is an incident management interface designed for operations and SRE teams to monitor, triage, and resolve system alerts across distributed microservices (`tracking-svc`, `billing-svc`, `auth-svc`, `notify-svc`).

It features a master-detail split layout, multi-criteria combinable filtering, chronological state lineage, and an asynchronous resolution workflow with **optimistic UI updates and automatic failure rollback**.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Alert Console — Optimistic Resolution                                           │
├───────────────────────────────────────────────┬─────────────────────────────────┤
│  Alerts (60)                                  │  AL-898 — detail                │
│  [Status ▼]  [Severity ▼]  [Source ▼]         │  billing-svc  [HIGH]            │
│  Showing 60 of 60             [✕ Clear]       │                                 │
│ ┌───────────────────────────────────────────┐ │  Timeline                       │
│ │ ID     Source       Severity Status  Act. │ │  ● OPEN       17 Aug 22:10      │
│ │ AL-901 tracking-svc CRITICAL OPEN    Res. │ │  ● ESCALATED  18 Aug 06:00      │
│ │ AL-898 billing-svc  HIGH     ESCAL.  Res. │ │                                 │
│ │ AL-882 auth-svc     MEDIUM   RESOLV.      │ │  Resolution note (required)     │
│ │ AL-871 tracking-svc LOW      AUTO-CL      │ │  [ Restarted consumer group   ] │
│ └───────────────────────────────────────────┘ │  [ Resolve ]                    │
│  Pagination / virtualization for large lists  │  Optimistic update (20% fail)   │
└───────────────────────────────────────────────┴─────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Abhishekkkkkkkkkkk/Alert-Console.git
cd Alert-Console
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm start
```
Open **[http://localhost:4200/](http://localhost:4200/)** in your browser.

### 4. Run automated tests
```bash
npm test -- --watch=false
```
Executes all **47 unit tests** via Vitest with 100% pass rate.

### 5. Build for production
```bash
npm run build
```
Generates optimized production assets in `dist/alert-console-angular/` (transfer size: **~54.8 kB**).

---

## ✨ Key Features

### 1. Alert Monitoring Grid
- **Color-Coded Severity Chips:**
  - `CRITICAL` — Dark Red
  - `HIGH` — Red
  - `MEDIUM` — Yellow
  - `LOW` — Green
- **5 Core Columns:** `ID`, `Source`, `Severity`, `Status`, `Created At`, plus inline action controls.
- **Newest-First Sort:** Automatically ordered chronologically by `createdAt` timestamp.
- **Full Keyboard Navigation:** Browse rows using `ArrowUp`/`ArrowDown` and select with `Enter`/`Space`.

### 2. Multi-Criteria Combinable Filters
- Three independent dropdowns: **Status** (`OPEN`, `ESCALATED`, `AUTO_CLOSED`, `RESOLVED`), **Severity**, and **Source**.
- **AND Semantics:** Selecting multiple filters narrows the list strictly to alerts matching all criteria.
- **Live Counter:** Dynamically shows `"Showing N of 60"` as filters change.
- **One-Click Reset:** Dedicated `Clear filters` button restores all alerts instantly.
- **Explicit Empty State:** Displays a clear zero-result graphic when no alerts match (never a blank table).

### 3. Master-Detail Inspection Panel
- Selecting any alert in the table updates the detail panel instantly.
- Displays metadata (`ID`, `Source`, `Severity`).
- Chronological **Timeline** showing the alert's complete state lineage with UTC timestamps (`17 Aug 22:10`, `18 Aug 06:00`).
- Pressing `Escape` deselects the active row and dismisses the panel.

### 4. Asynchronous Resolution Flow
- The **Resolve** action appears only for eligible alerts (`OPEN` and `ESCALATED`). Alerts in `RESOLVED` or `AUTO_CLOSED` states never render a resolve button.
- Requires a mandatory note.
- Simulates an **800 ms asynchronous save** (`Promise` + `setTimeout`).
- Disables the button and shows an animated loading spinner during save to prevent double-submits.

### 5. Optimistic Updates & Rollback (Stretch Goal)
- When clicking **Resolve**, the alert transitions to `RESOLVED` **immediately** with a pending timeline indicator (`RESOLVED? pending`).
- Simulates real-world network unreliability with a **~20% random rejection rate**.
- **On Success:** The optimistic entry is confirmed and the in-flight state lock is released.
- **On Failure:** The alert automatically rolls back to its exact previous state (`OPEN` or `ESCALATED`), the pending timeline entry is discarded, and an error toast notification alerts the operator.

---

## 🛡️ Edge Cases Handled

| Scenario | Handled Behavior |
| :--- | :--- |
| **Whitespace-only note** | Submitting only spaces/tabs is blocked with an inline validation message (`role="alert"`). No browser `alert()` is used. |
| **In-Flight Filter Changes** | Adjusting filters while an 800 ms save is in flight does not lose or corrupt the pending update. |
| **Selection Decoupling** | Clicking another table row while a save is in flight does not redirect the update to the newly clicked row. |
| **Double-Click Submit** | In-flight ID locking ignores concurrent clicks and disables the submit button with `aria-busy="true"`. |
| **Ineligible Alert Action** | Domain guard `isAlertResolvable()` blocks any attempt to resolve an already resolved or auto-closed alert. |

---

## 🏗️ Architecture & Technical Design

```
                     ┌───────────────────────────┐
                     │       App Component       │ (Root Shell & Keyboard Listeners)
                     └─────────────┬─────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      │                            │                            │
┌─────▼─────┐                ┌─────▼─────┐                ┌─────▼─────┐
│  Header   │                │ FilterBar │                │DetailPanel│
└───────────┘                └─────┬─────┘                └─────┬─────┘
                                   │                            │
                             ┌─────▼─────┐                ┌─────┴─────┐
                             │AlertTable │                │ Timeline  │
                             └─────┬─────┘                │ResolveForm│
                                   │                      └───────────┘
                             ┌─────▼─────┐
                             │ Chips     │
                             └───────────┘
```

### Unidirectional Reactive Data Flow
- **Single Source of Truth:** `AlertService` manages raw alert data (`_alerts`), filter state (`_filters`), and in-flight operations (`_inFlightIds`) using Angular Signals.
- **Derived State via `computed()`:** Filtered lists (`filteredAlerts`) and the selected alert (`selectedAlert`) are reactive computed signals that re-evaluate automatically.
- **`OnPush` Change Detection:** Configured across 100% of components to eliminate unnecessary re-renders.
- **Zero Third-Party UI Bloat:** Pure HTML5, scoped CSS custom properties, and inline SVGs. Zero external UI component libraries.

---

## 📁 Project Structure

```
src/app/
├── components/
│   ├── alert-table/        # Accessible table with keyboard navigation & row states
│   ├── detail-panel/       # Master-detail inspector & optimistic callout card
│   ├── empty-state/        # Explicit zero-match graphic & reset action
│   ├── filter-bar/         # Status, Severity, Source dropdowns & live counter
│   ├── header/             # Executive navy banner
│   ├── resolve-form/       # Note input, inline error validation & 800ms spinner
│   ├── severity-chip/      # WCAG AA color-coded severity pills
│   ├── status-chip/        # Status badges with active save spinner dot
│   ├── timeline/           # Chronological vertical lineage with <time> tags
│   └── toast-container/    # Reactive floating toast notification stack
├── data/
│   ├── mock-alerts.ts      # Deterministic ~60 alert generator & UTC date formatters
│   └── mock-alerts.spec.ts # Unit tests for data generation & ordering
├── models/
│   ├── alert.model.ts      # Strongly typed domain interfaces & pure validation rules
│   └── alert.model.spec.ts # Unit tests for domain rules
├── services/
│   ├── alert.service.ts    # Central Signal-based store, async save & rollback logic
│   ├── alert.service.spec.ts # 18 comprehensive tests for store, filters & concurrency
│   └── toast.service.ts    # Reactive toast notification service
├── app.ts                  # Root orchestrator & keyboard shortcuts
├── app.html                # Responsive split-pane layout
├── app.spec.ts             # End-to-end component integration tests
└── app.config.ts           # Application providers
```

---

## 🧪 Testing Summary

Automated testing is powered by **Vitest** and **Angular TestBed**:

```
Test Files  5 passed (5)
     Tests  47 passed (47)
  Duration  ~25s
```

* **`alert.model.spec.ts` (9 tests):** Validates note whitespace rejection and resolution eligibility rules.
* **`mock-alerts.spec.ts` (8 tests):** Validates 60 alerts generation, allowed enum values, newest-first sort order, and chronological history.
* **`alert.service.spec.ts` (18 tests):** Validates multi-filter AND semantics, live counts, selection updates, double-submit protection, in-flight filter consistency, 800ms async delay, and failure rollback.
* **`resolve-form.component.spec.ts` (6 tests):** Validates form mounting, inline error display, typing error clearance, and loading spinner state.
* **`app.spec.ts` (6 tests):** Validates root bootstrapping, header rendering, counter display, table rows, and `Escape` key panel dismissal.

---

## 🚀 Performance & Bundle

* **Change Detection:** 100% `ChangeDetectionStrategy.OnPush`
* **DOM Reconciliation:** `@for (...; track alert.id)` for efficient table row recycling
* **Production Bundle Transfer Size:**
  - `main.js`: **54.02 kB** (gzipped)
  - `styles.css`: **832 bytes** (gzipped)
  - **Total Transfer Size: ~54.8 kB**

---

## ♿ Accessibility (WCAG 2.1 AA)

- Semantic HTML (`<header role="banner">`, `<main>`, `<table scope="col">`, `<time>`).
- ARIA live regions: `aria-live="polite"` for filter counts, `aria-live="assertive"` for inline validation errors.
- Active async states announce `aria-busy="true"`.
- Keyboard navigation: Full row navigation with Arrow keys and Escape key support.
- All severity and status color chips meet or exceed the **4.5:1** contrast ratio requirement.
