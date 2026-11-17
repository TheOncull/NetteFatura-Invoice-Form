import { beforeEach, describe, expect, it, vi } from "vitest";

import "../src/index";
import type { NetteFaturaInvoiceForm } from "../src/nettefatura-invoice-form";
import type { Province, TaxOffice } from "../src/types";

const provinces: Province[] = [
  {
    code: "34",
    name: "İstanbul",
    districts: [{ code: "1103", name: "Kadıköy" }],
  },
  {
    code: "06",
    name: "Ankara",
    districts: [{ code: "1231", name: "Çankaya" }],
  },
];

const taxOffices: Record<string, TaxOffice[]> = {
  "34": [{ code: "034225", name: "Kadıköy Vergi Dairesi" }],
  "06": [{ code: "006201", name: "Ankara Vergi Dairesi" }],
};

function createElement(): NetteFaturaInvoiceForm {
  const element = document.createElement(
    "nettefatura-invoice-form",
  ) as NetteFaturaInvoiceForm;
  element.locationProvider = async () => provinces;
  element.taxOfficeProvider = async (provinceCode) =>
    taxOffices[provinceCode] ?? [];
  document.body.append(element);
  return element;
}

function control<
  T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
>(element: NetteFaturaInvoiceForm, name: string): T {
  const found = element.shadowRoot?.querySelector<T>(`[name="${name}"]`);
  if (!found) throw new Error(`Missing control: ${name}`);
  return found;
}

function change(
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string | boolean,
): void {
  if (input instanceof HTMLInputElement && input.type === "checkbox") {
    input.checked = Boolean(value);
  } else {
    input.value = String(value);
  }
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function expand(element: NetteFaturaInvoiceForm): Promise<void> {
  change(control<HTMLInputElement>(element, "corporateInvoice"), true);
  await flush();
}

async function fillValidForm(element: NetteFaturaInvoiceForm): Promise<void> {
  await expand(element);
  change(
    control<HTMLInputElement>(element, "companyName"),
    "Örnek Teknoloji A.Ş.",
  );
  change(control<HTMLInputElement>(element, "taxId"), "1000000018");
  change(control<HTMLSelectElement>(element, "provinceCode"), "34");
  await flush();
  change(control<HTMLSelectElement>(element, "districtCode"), "1103");
  change(control<HTMLSelectElement>(element, "taxOfficeCode"), "034225");
  change(
    control<HTMLTextAreaElement>(element, "billingAddress"),
    "Caferağa Mah. Moda Cad. No: 10 D: 4",
  );
}

describe("nettefatura-invoice-form", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("renders collapsed with Turkish customer-facing labels", async () => {
    const element = createElement();
    await flush();

    expect(element.shadowRoot?.textContent).toContain(
      "Kurumsal fatura istiyorum",
    );
    expect(element.shadowRoot?.querySelector("[data-form]")).toBeNull();

    await expand(element);

    expect(element.shadowRoot?.textContent).toContain("Firma adı");
    expect(element.shadowRoot?.textContent).toContain("Fatura adresi");
  });

  it("loads provider options and resets dependent selections on province change", async () => {
    const element = createElement();
    await expand(element);

    const province = control<HTMLSelectElement>(element, "provinceCode");
    expect([...province.options].map((option) => option.text)).toContain(
      "İstanbul",
    );
    change(province, "34");
    await flush();

    expect(
      control<HTMLSelectElement>(element, "districtCode").textContent,
    ).toContain("Kadıköy");
    expect(
      control<HTMLSelectElement>(element, "taxOfficeCode").textContent,
    ).toContain("Kadıköy Vergi Dairesi");
    change(control<HTMLSelectElement>(element, "districtCode"), "1103");
    change(control<HTMLSelectElement>(element, "taxOfficeCode"), "034225");
    change(control<HTMLSelectElement>(element, "provinceCode"), "06");
    await flush();

    expect(element.value.districtCode).toBe("");
    expect(element.value.taxOfficeCode).toBe("");
  });

  it("emits a complete value and maps it for NetteFatura", async () => {
    const element = createElement();
    const received: unknown[] = [];
    element.addEventListener("nettefatura-change", (event) => {
      received.push((event as CustomEvent).detail);
    });

    await fillValidForm(element);

    expect(element.value).toMatchObject({
      corporateInvoice: true,
      companyName: "Örnek Teknoloji A.Ş.",
      provinceName: "İstanbul",
      districtName: "Kadıköy",
      taxOfficeName: "Kadıköy Vergi Dairesi",
    });
    expect(received.at(-1)).toEqual(element.value);
    expect(element.toNetteFaturaReceiver().Address).toEqual({
      BoulevardAveneuStreetName: "Caferağa Mah. Moda Cad. No: 10 D: 4",
      CityCode: "34",
      CityName: "İstanbul",
      TownCode: "1103",
      TownName: "Kadıköy",
      TaxOfficeCode: "034225",
      TaxOfficeName: "Kadıköy Vergi Dairesi",
      CountryName: "TÜRKİYE",
    });
  });

  it("shows accessible validation errors and emits validity changes", async () => {
    const element = createElement();
    const validity = vi.fn();
    element.addEventListener("nettefatura-validity-change", validity);
    await expand(element);

    expect(element.validate()).toBe(false);

    const companyName = control<HTMLInputElement>(element, "companyName");
    expect(companyName.getAttribute("aria-invalid")).toBe("true");
    expect(element.shadowRoot?.textContent).toContain("Bu alan zorunludur.");
    expect((validity.mock.calls.at(-1)?.[0] as CustomEvent).detail).toEqual({
      valid: false,
    });
  });

  it("clears stale invoice details when corporate invoicing is turned off", async () => {
    const element = createElement();
    await fillValidForm(element);

    change(control<HTMLInputElement>(element, "corporateInvoice"), false);
    await flush();

    expect(element.value).toEqual({
      corporateInvoice: false,
      companyName: "",
      taxId: "",
      provinceCode: "",
      provinceName: "",
      districtCode: "",
      districtName: "",
      taxOfficeCode: "",
      taxOfficeName: "",
      billingAddress: "",
    });
    expect(element.shadowRoot?.querySelector("[data-form]")).toBeNull();
  });

  it("replaces providers and labels without duplicating control listeners", async () => {
    const element = createElement();
    await flush();
    element.labels = { companyName: "Ticari unvan" };
    element.locationProvider = async () => [provinces[1]!];
    await expand(element);
    await flush();

    expect(element.shadowRoot?.textContent).toContain("Ticari unvan");
    expect(
      control<HTMLSelectElement>(element, "provinceCode").textContent,
    ).not.toContain("İstanbul");

    const listener = vi.fn();
    element.addEventListener("nettefatura-change", listener);
    change(
      control<HTMLInputElement>(element, "companyName"),
      "Tek Değişiklik A.Ş.",
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reset returns the component to its initial collapsed state", async () => {
    const element = createElement();
    await fillValidForm(element);

    element.reset();

    expect(element.value.corporateInvoice).toBe(false);
    expect(control<HTMLInputElement>(element, "corporateInvoice").checked).toBe(
      false,
    );
  });
});
