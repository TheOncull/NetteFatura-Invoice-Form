import { describe, expect, it, vi } from "vitest";

import { InvoiceDataController } from "../src/data-controller";
import type { Province, TaxOffice } from "../src/types";

const provinces: Province[] = [
  {
    code: "34",
    name: "İstanbul",
    districts: [
      { code: "1103", name: "Kadıköy" },
      { code: "1106", name: "Beşiktaş" },
    ],
  },
  {
    code: "06",
    name: "Ankara",
    districts: [{ code: "1231", name: "Çankaya" }],
  },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

describe("InvoiceDataController", () => {
  it("loads locations and exposes an immutable snapshot", async () => {
    const controller = new InvoiceDataController({
      locationProvider: async () => provinces,
      taxOfficeProvider: async () => [],
    });

    await controller.loadLocations();

    expect(controller.state.locationStatus).toBe("ready");
    expect(controller.state.provinces).toEqual(provinces);
    expect(Object.isFrozen(controller.state)).toBe(true);
    expect(Object.isFrozen(controller.state.provinces)).toBe(true);
  });

  it("filters districts and clears dependent selections on province change", async () => {
    const controller = new InvoiceDataController({
      locationProvider: async () => provinces,
      taxOfficeProvider: async () => [
        { code: "034225", name: "Kadıköy Vergi Dairesi" },
      ],
    });
    await controller.loadLocations();

    await controller.selectProvince("34");
    controller.selectDistrict("1103");
    controller.selectTaxOffice("034225");
    await controller.selectProvince("06");

    expect(controller.state.districts).toEqual([
      { code: "1231", name: "Çankaya" },
    ]);
    expect(controller.state.selectedDistrictCode).toBe("");
    expect(controller.state.selectedTaxOfficeCode).toBe("");
  });

  it("exposes a safe error and retries a rejected tax-office provider", async () => {
    const taxOfficeProvider = vi
      .fn<(provinceCode: string) => Promise<TaxOffice[]>>()
      .mockRejectedValueOnce(new Error("SOAP host and token details"))
      .mockResolvedValueOnce([
        { code: "034225", name: "Kadıköy Vergi Dairesi" },
      ]);
    const controller = new InvoiceDataController({
      locationProvider: async () => provinces,
      taxOfficeProvider,
    });
    await controller.loadLocations();

    await controller.selectProvince("34");

    expect(controller.state.taxOfficeStatus).toBe("error");
    expect(controller.state.error).toBe("tax-offices");
    expect(JSON.stringify(controller.state)).not.toContain("SOAP host");

    await controller.retryTaxOffices();

    expect(controller.state.taxOfficeStatus).toBe("ready");
    expect(controller.state.taxOffices).toEqual([
      { code: "034225", name: "Kadıköy Vergi Dairesi" },
    ]);
  });

  it("ignores a stale tax-office response after a rapid province change", async () => {
    const istanbul = deferred<TaxOffice[]>();
    const ankara = deferred<TaxOffice[]>();
    const controller = new InvoiceDataController({
      locationProvider: async () => provinces,
      taxOfficeProvider: (provinceCode) =>
        provinceCode === "34" ? istanbul.promise : ankara.promise,
    });
    await controller.loadLocations();

    const firstSelection = controller.selectProvince("34");
    const secondSelection = controller.selectProvince("06");
    ankara.resolve([{ code: "006201", name: "Ankara Vergi Dairesi" }]);
    await secondSelection;
    istanbul.resolve([{ code: "034225", name: "Kadıköy Vergi Dairesi" }]);
    await firstSelection;

    expect(controller.state.selectedProvinceCode).toBe("06");
    expect(controller.state.taxOffices).toEqual([
      { code: "006201", name: "Ankara Vergi Dairesi" },
    ]);
  });
});
