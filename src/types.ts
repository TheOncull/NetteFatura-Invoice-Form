export interface District {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export interface TaxOffice {
  code: string;
  name: string;
}

export type LocationProvider = () => Promise<Province[]>;
export type TaxOfficeProvider = (provinceCode: string) => Promise<TaxOffice[]>;

export interface InvoiceFormValue {
  corporateInvoice: boolean;
  companyName: string;
  taxId: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  taxOfficeCode: string;
  taxOfficeName: string;
  billingAddress: string;
}

export type InvoiceFormField =
  | "companyName"
  | "taxId"
  | "provinceCode"
  | "districtCode"
  | "taxOfficeCode"
  | "billingAddress";

export type ValidationError = "required" | "invalid";

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<InvoiceFormField, ValidationError>>;
}

export interface NetteFaturaAddress {
  BoulevardAveneuStreetName: string;
  CityCode: string;
  CityName: string;
  TownCode: string;
  TownName: string;
  TaxOfficeCode: string;
  TaxOfficeName: string;
  CountryName: "TÜRKİYE";
}

export interface NetteFaturaReceiver {
  ReceiverName: string;
  ReceiverTaxCode: string;
  Address: NetteFaturaAddress;
}

export interface InvoiceFormLabels {
  toggle: string;
  companyName: string;
  companyNamePlaceholder: string;
  taxId: string;
  taxIdPlaceholder: string;
  province: string;
  provincePlaceholder: string;
  district: string;
  districtPlaceholder: string;
  taxOffice: string;
  taxOfficePlaceholder: string;
  billingAddress: string;
  billingAddressPlaceholder: string;
  loading: string;
  retry: string;
  requiredError: string;
  invalidTaxIdError: string;
  providerError: string;
}
