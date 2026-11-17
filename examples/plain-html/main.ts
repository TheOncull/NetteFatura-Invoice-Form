import "../../src";
import type { NetteFaturaInvoiceForm } from "../../src";
import { provinces, taxOffices } from "./mock-data";

const form = document.querySelector<NetteFaturaInvoiceForm>(
  "nettefatura-invoice-form",
);
const output = document.querySelector<HTMLElement>("#output");

if (!form || !output) {
  throw new Error("Example form could not be initialized.");
}

form.locationProvider = async () => provinces;
form.taxOfficeProvider = async (provinceCode) => taxOffices[provinceCode] ?? [];

form.addEventListener("nettefatura-change", (event) => {
  const detail = (event as CustomEvent).detail;
  output.textContent = JSON.stringify(detail, null, 2);
});
