import type {
  InvoiceFormField,
  InvoiceFormValue,
  NetteFaturaReceiver,
  ValidationResult,
} from "./types";

const REQUIRED_FIELDS: readonly InvoiceFormField[] = [
  "companyName",
  "taxId",
  "provinceCode",
  "districtCode",
  "taxOfficeCode",
  "billingAddress",
];

export function validateTaxId(value: string): boolean {
  if (!/^\d{10}$|^\d{11}$/.test(value)) {
    return false;
  }

  return value.length === 10 ? validateVkn(value) : validateTckn(value);
}

function validateVkn(value: string): boolean {
  const digits = [...value].map(Number);
  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    const digit = digits[index];
    if (digit === undefined) {
      return false;
    }

    const position = 9 - index;
    const shifted = (digit + position) % 10;
    const powered = (shifted * 2 ** position) % 9;
    sum += shifted !== 0 && powered === 0 ? 9 : powered;
  }

  return (10 - (sum % 10)) % 10 === digits[9];
}

function validateTckn(value: string): boolean {
  const digits = [...value].map(Number);
  if (digits[0] === 0) {
    return false;
  }

  const oddSum =
    (digits[0] ?? 0) +
    (digits[2] ?? 0) +
    (digits[4] ?? 0) +
    (digits[6] ?? 0) +
    (digits[8] ?? 0);
  const evenSum =
    (digits[1] ?? 0) + (digits[3] ?? 0) + (digits[5] ?? 0) + (digits[7] ?? 0);
  const tenth = (oddSum * 7 - evenSum) % 10;
  const eleventh =
    digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;

  return tenth === digits[9] && eleventh === digits[10];
}

export function validateInvoiceForm(value: InvoiceFormValue): ValidationResult {
  if (!value.corporateInvoice) {
    return { valid: true, errors: {} };
  }

  const errors: ValidationResult["errors"] = {};

  for (const field of REQUIRED_FIELDS) {
    if (!value[field].trim()) {
      errors[field] = "required";
    }
  }

  if (value.taxId.trim() && !validateTaxId(value.taxId.trim())) {
    errors.taxId = "invalid";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function mapToNetteFaturaReceiver(
  value: InvoiceFormValue,
): NetteFaturaReceiver {
  const validation = validateInvoiceForm(value);
  if (!value.corporateInvoice || !validation.valid) {
    throw new TypeError("Cannot map an invalid corporate invoice form.");
  }

  return {
    ReceiverName: value.companyName.trim(),
    ReceiverTaxCode: value.taxId.trim(),
    Address: {
      BoulevardAveneuStreetName: value.billingAddress.trim(),
      CityCode: value.provinceCode,
      CityName: value.provinceName,
      TownCode: value.districtCode,
      TownName: value.districtName,
      TaxOfficeCode: value.taxOfficeCode,
      TaxOfficeName: value.taxOfficeName,
      CountryName: "TÜRKİYE",
    },
  };
}
