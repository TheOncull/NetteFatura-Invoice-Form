import { describe, expect, it } from "vitest";

import {
  mapToNetteFaturaReceiver,
  validateInvoiceForm,
  validateTaxId,
} from "../src/domain";
import type { InvoiceFormValue } from "../src/types";

const validValue: InvoiceFormValue = {
  corporateInvoice: true,
  companyName: "Örnek Teknoloji A.Ş.",
  taxId: "1000000018",
  provinceCode: "34",
  provinceName: "İstanbul",
  districtCode: "1103",
  districtName: "Kadıköy",
  taxOfficeCode: "034225",
  taxOfficeName: "Kadıköy Vergi Dairesi",
  billingAddress: "Caferağa Mah. Moda Cad. No: 10 D: 4",
};

describe("validateTaxId", () => {
  it("accepts VKN and TCKN values with valid checksums", () => {
    expect(validateTaxId("1000000018")).toBe(true);
    expect(validateTaxId("10000000146")).toBe(true);
  });

  it("rejects non-digits, wrong lengths, and checksum failures", () => {
    expect(validateTaxId("1000000017")).toBe(false);
    expect(validateTaxId("10000000147")).toBe(false);
    expect(validateTaxId("123")).toBe(false);
    expect(validateTaxId("100000001A")).toBe(false);
  });
});

describe("validateInvoiceForm", () => {
  it("treats a disabled corporate invoice form as valid", () => {
    const result = validateInvoiceForm({
      ...validValue,
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

    expect(result).toEqual({ valid: true, errors: {} });
  });

  it("reports every required corporate field and an invalid tax ID", () => {
    const result = validateInvoiceForm({
      ...validValue,
      companyName: "",
      taxId: "1234567891",
      provinceCode: "",
      districtCode: "",
      taxOfficeCode: "",
      billingAddress: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      companyName: "required",
      taxId: "invalid",
      provinceCode: "required",
      districtCode: "required",
      taxOfficeCode: "required",
      billingAddress: "required",
    });
  });
});

describe("mapToNetteFaturaReceiver", () => {
  it("maps the form to the exact NetteFatura receiver address shape", () => {
    expect(mapToNetteFaturaReceiver(validValue)).toEqual({
      ReceiverName: "Örnek Teknoloji A.Ş.",
      ReceiverTaxCode: "1000000018",
      Address: {
        BoulevardAveneuStreetName: "Caferağa Mah. Moda Cad. No: 10 D: 4",
        CityCode: "34",
        CityName: "İstanbul",
        TownCode: "1103",
        TownName: "Kadıköy",
        TaxOfficeCode: "034225",
        TaxOfficeName: "Kadıköy Vergi Dairesi",
        CountryName: "TÜRKİYE",
      },
    });
  });

  it("throws when corporate invoice details are invalid", () => {
    expect(() =>
      mapToNetteFaturaReceiver({ ...validValue, companyName: "" }),
    ).toThrow("Cannot map an invalid corporate invoice form");
  });
});
