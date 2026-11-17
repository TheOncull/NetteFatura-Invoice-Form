import { NetteFaturaInvoiceForm } from "./nettefatura-invoice-form";

if (!customElements.get("nettefatura-invoice-form")) {
  customElements.define("nettefatura-invoice-form", NetteFaturaInvoiceForm);
}

export { NetteFaturaInvoiceForm } from "./nettefatura-invoice-form";
export {
  mapToNetteFaturaReceiver,
  validateInvoiceForm,
  validateTaxId,
} from "./domain";
export type {
  District,
  InvoiceFormLabels,
  InvoiceFormValue,
  LocationProvider,
  NetteFaturaAddress,
  NetteFaturaReceiver,
  Province,
  TaxOffice,
  TaxOfficeProvider,
  ValidationResult,
} from "./types";
