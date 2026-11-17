# NetteFatura Invoice Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a framework-agnostic corporate-invoice form that Turkish websites can connect to their server-side NetteFatura integration.

**Architecture:** A TypeScript Web Component renders an isolated, responsive form in Shadow DOM. Pure domain functions own validation and NetteFatura mapping, while injected async providers supply provinces/districts and tax offices without exposing SOAP access in the browser.

**Tech Stack:** TypeScript 5, native Web Components, Vite library mode, Vitest, jsdom, ESLint, Prettier

**Spec:** `docs/superpowers/specs/2026-11-17-invoice-form-design.md`

## Global Constraints

- Developer-facing code and documentation are English; default end-user labels are Turkish.
- No UI framework runtime dependency.
- No browser-side SOAP request, credential, customer-data persistence, or logging.
- Province changes clear district and tax-office selections.
- The billing address remains one free-form field.
- The repository is MIT licensed; third-party data is not bundled without compatible licensing and attribution.

## Review Focus

- A provider rejection shows a safe error and leaves the component usable for retry.
- Rapid province changes cannot let an older tax-office response overwrite the latest selection.
- Turkish VKN/TCKN validation rejects incorrect lengths and checksum failures.
- Turning corporate invoicing off clears validation errors but preserves no stale invoice payload.
- Replacing providers or labels after connection triggers a consistent rerender without duplicate event listeners.

---

### Task 1: Package foundation and domain rules

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/types.ts`
- Create: `src/domain.ts`
- Test: `test/domain.test.ts`

**Interfaces:**

- Produces: `validateTaxId(value: string): boolean`, `validateInvoiceForm(value: InvoiceFormValue): ValidationResult`, and `mapToNetteFaturaReceiver(value: InvoiceFormValue): NetteFaturaReceiver`.

- [ ] **Step 1: Write failing domain tests** for valid/invalid VKN and TCKN checksums, required corporate fields, the disabled-state payload, and exact NetteFatura address mapping.
- [ ] **Step 2: Run `npm test -- test/domain.test.ts`** and verify failure because domain exports do not exist.
- [ ] **Step 3: Implement the typed domain functions** in `src/domain.ts` and shared public types in `src/types.ts`.
- [ ] **Step 4: Run `npm test -- test/domain.test.ts`** and verify all domain tests pass.
- [ ] **Step 5: Commit** with `feat: add invoice form domain model`.

### Task 2: Dependent data controller

**Files:**

- Create: `src/data-controller.ts`
- Test: `test/data-controller.test.ts`

**Interfaces:**

- Consumes: `LocationProvider`, `TaxOfficeProvider`, `Province`, `District`, and `TaxOffice` from `src/types.ts`.
- Produces: `InvoiceDataController.loadLocations()`, `selectProvince(code: string)`, `retryTaxOffices()`, and immutable controller state snapshots.

- [ ] **Step 1: Write failing controller tests** for initial location loading, province-filtered districts, dependent-field reset, rejected-provider retry, and stale async tax-office response suppression.
- [ ] **Step 2: Run `npm test -- test/data-controller.test.ts`** and verify failure because the controller does not exist.
- [ ] **Step 3: Implement `InvoiceDataController`** with request sequencing and safe provider-error state.
- [ ] **Step 4: Run `npm test -- test/data-controller.test.ts`** and verify all controller tests pass.
- [ ] **Step 5: Commit** with `feat: add dependent location data controller`.

### Task 3: Web Component behavior

**Files:**

- Create: `src/nettefatura-invoice-form.ts`
- Create: `src/index.ts`
- Test: `test/nettefatura-invoice-form.test.ts`

**Interfaces:**

- Consumes: domain functions from Task 1 and `InvoiceDataController` from Task 2.
- Produces: registered `nettefatura-invoice-form`, public properties, `value`, `validate()`, `toNetteFaturaReceiver()`, `reset()`, and documented custom events.

- [ ] **Step 1: Write failing component tests** for collapsed/expanded rendering, Turkish defaults, provider-driven options, resets, event payloads, validation, disabled-state clearing, provider replacement, and duplicate-listener prevention.
- [ ] **Step 2: Run `npm test -- test/nettefatura-invoice-form.test.ts`** and verify failure because the custom element is not registered.
- [ ] **Step 3: Implement the custom element** with semantic controls, Shadow DOM, injected providers, and accessible error/status output.
- [ ] **Step 4: Run `npm test -- test/nettefatura-invoice-form.test.ts`** and verify all component tests pass.
- [ ] **Step 5: Commit** with `feat: add reusable NetteFatura invoice form element`.

### Task 4: Styling and runnable examples

**Files:**

- Create: `src/styles.ts`
- Create: `examples/plain-html/index.html`
- Create: `examples/plain-html/main.ts`
- Create: `examples/plain-html/mock-data.ts`
- Test: `test/accessibility.test.ts`

**Interfaces:**

- Consumes: the registered element and provider interfaces from Task 3.
- Produces: responsive reference-inspired presentation and a runnable integration example.

- [ ] **Step 1: Write failing accessibility tests** for label/control association, keyboard-operable checkbox, error announcement, and mobile field ordering.
- [ ] **Step 2: Run `npm test -- test/accessibility.test.ts`** and verify the new expectations fail.
- [ ] **Step 3: Add component styles and the plain-HTML example** using local mock providers only.
- [ ] **Step 4: Run the focused test, full test suite, type check, lint, and production build** and verify all succeed without warnings.
- [ ] **Step 5: Commit** with `feat: add responsive styling and example`.

### Task 5: Integration documentation and license

**Files:**

- Create: `README.md`
- Create: `LICENSE`
- Create: `docs/integration.md`
- Create: `docs/nettefatura-backend.md`
- Create: `SECURITY.md`
- Create: `.gitignore`

**Interfaces:**

- Consumes: the public API from Task 3 and the runnable example from Task 4.
- Produces: English installation, customization, framework integration, backend lookup, security, and contribution guidance.

- [ ] **Step 1: Add a documentation verification script/test** that checks every documented public method, event, and referenced file exists.
- [ ] **Step 2: Run the documentation check** and verify it fails before the documents are present.
- [ ] **Step 3: Write the detailed English README, integration guides, security policy, MIT license, and ignore rules** without copying private correspondence or official PDFs.
- [ ] **Step 4: Run documentation verification, full tests, type check, lint, and build** and verify all succeed.
- [ ] **Step 5: Commit** with `docs: add integration guides and MIT license`.

### Task 6: GitHub publication

**Files:**

- Modify: `README.md` only if the final GitHub URL requires link updates.

**Interfaces:**

- Consumes: the verified local repository.
- Produces: public GitHub repository `NetteFatura-Invoice-Form` with the complete default branch.

- [ ] **Step 1: Inspect the final diff and repository status** to confirm no private PDFs, emails, credentials, company-specific values, build output, or customer data are tracked.
- [ ] **Step 2: Run `npm test`, type check, lint, and build one final time** and record the successful output.
- [ ] **Step 3: Create the public GitHub repository `NetteFatura-Invoice-Form`** with an English description and MIT license metadata.
- [ ] **Step 4: Push the verified commit history** and confirm README and MIT license render correctly on GitHub.
- [ ] **Step 5: Report the repository URL and verification results**.
