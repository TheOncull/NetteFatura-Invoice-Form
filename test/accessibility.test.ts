import { beforeEach, describe, expect, it } from "vitest";

import "../src/index";
import type { NetteFaturaInvoiceForm } from "../src/nettefatura-invoice-form";

function createElement(): NetteFaturaInvoiceForm {
  const element = document.createElement(
    "nettefatura-invoice-form",
  ) as NetteFaturaInvoiceForm;
  element.locationProvider = async () => [
    {
      code: "34",
      name: "İstanbul",
      districts: [{ code: "1103", name: "Kadıköy" }],
    },
  ];
  element.taxOfficeProvider = async () => [
    { code: "034225", name: "Kadıköy Vergi Dairesi" },
  ];
  document.body.append(element);
  return element;
}

function change(input: HTMLInputElement, checked: boolean): void {
  input.checked = checked;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("invoice form accessibility", () => {
  beforeEach(() => document.body.replaceChildren());

  it("explicitly associates every visible label with its control", async () => {
    const element = createElement();
    await flush();
    const checkbox = element.shadowRoot?.querySelector<HTMLInputElement>(
      '[name="corporateInvoice"]',
    );
    expect(checkbox).not.toBeNull();
    change(checkbox!, true);

    const labels = [
      ...(element.shadowRoot?.querySelectorAll<HTMLLabelElement>(
        "label[for]",
      ) ?? []),
    ];
    expect(labels.length).toBe(7);
    for (const label of labels) {
      const control = element.shadowRoot?.getElementById(label.htmlFor);
      expect(control).not.toBeNull();
    }
  });

  it("keeps the native checkbox keyboard focusable", async () => {
    const element = createElement();
    await flush();
    const checkbox = element.shadowRoot?.querySelector<HTMLInputElement>(
      '[name="corporateInvoice"]',
    );

    expect(checkbox?.type).toBe("checkbox");
    expect(checkbox?.tabIndex).toBe(0);
    expect(checkbox?.disabled).toBe(false);
  });

  it("connects validation errors to controls and announces them", async () => {
    const element = createElement();
    await flush();
    const checkbox = element.shadowRoot?.querySelector<HTMLInputElement>(
      '[name="corporateInvoice"]',
    );
    change(checkbox!, true);

    element.validate();

    const companyName = element.shadowRoot?.querySelector<HTMLInputElement>(
      '[name="companyName"]',
    );
    const errorId = companyName?.getAttribute("aria-describedby");
    const error = errorId ? element.shadowRoot?.getElementById(errorId) : null;
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.textContent).toContain("Bu alan zorunludur.");
  });

  it("uses a logical single-column field order for narrow screens", async () => {
    const element = createElement();
    await flush();
    const checkbox = element.shadowRoot?.querySelector<HTMLInputElement>(
      '[name="corporateInvoice"]',
    );
    change(checkbox!, true);

    const fieldOrder = [
      ...(element.shadowRoot?.querySelectorAll<HTMLElement>("[data-field]") ??
        []),
    ].map((field) => field.dataset.field);

    expect(fieldOrder).toEqual([
      "companyName",
      "taxId",
      "provinceCode",
      "districtCode",
      "taxOfficeCode",
      "billingAddress",
    ]);
  });
});
