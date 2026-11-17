import {
  InvoiceDataController,
  type InvoiceDataState,
} from "./data-controller";
import { mapToNetteFaturaReceiver, validateInvoiceForm } from "./domain";
import { componentStyles } from "./styles";
import type {
  InvoiceFormLabels,
  InvoiceFormValue,
  LocationProvider,
  NetteFaturaReceiver,
  TaxOfficeProvider,
  ValidationResult,
} from "./types";

const EMPTY_VALUE: InvoiceFormValue = {
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
};

const DEFAULT_LABELS: InvoiceFormLabels = {
  toggle: "Kurumsal fatura istiyorum",
  companyName: "Firma adı",
  companyNamePlaceholder: "Firma adını girin",
  taxId: "Vergi numarası / TCKN",
  taxIdPlaceholder: "Vergi numarasını girin",
  province: "Şehir",
  provincePlaceholder: "Şehir seçin",
  district: "İlçe",
  districtPlaceholder: "İlçe seçin",
  taxOffice: "Vergi dairesi",
  taxOfficePlaceholder: "Vergi dairesi seçin",
  billingAddress: "Fatura adresi",
  billingAddressPlaceholder:
    "Mahalle, cadde/sokak, bina adı, dış kapı ve iç kapı numarasıyla birlikte açık adresinizi yazın",
  loading: "Yükleniyor…",
  retry: "Tekrar dene",
  requiredError: "Bu alan zorunludur.",
  invalidTaxIdError: "Geçerli bir VKN veya TCKN girin.",
  providerError: "Seçenekler yüklenemedi. Lütfen tekrar deneyin.",
};

let instanceCounter = 0;

export class NetteFaturaInvoiceForm extends HTMLElement {
  #locationProvider: LocationProvider = async () => [];
  #taxOfficeProvider: TaxOfficeProvider = async () => [];
  #labels: InvoiceFormLabels = { ...DEFAULT_LABELS };
  #value: InvoiceFormValue = { ...EMPTY_VALUE };
  #validation: ValidationResult = { valid: true, errors: {} };
  #controller: InvoiceDataController | null = null;
  #dataState: InvoiceDataState | null = null;
  #lastError: InvoiceDataState["error"] = null;
  readonly #idPrefix = `nettefatura-${++instanceCounter}`;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.addEventListener("change", this.#handleChange);
    root.addEventListener("click", this.#handleClick);
    this.#render();
  }

  connectedCallback(): void {
    this.#rebuildController();
  }

  set locationProvider(provider: LocationProvider) {
    this.#locationProvider = provider;
    if (this.isConnected) this.#rebuildController();
  }

  get locationProvider(): LocationProvider {
    return this.#locationProvider;
  }

  set taxOfficeProvider(provider: TaxOfficeProvider) {
    this.#taxOfficeProvider = provider;
    if (this.isConnected) this.#rebuildController();
  }

  get taxOfficeProvider(): TaxOfficeProvider {
    return this.#taxOfficeProvider;
  }

  set labels(labels: Partial<InvoiceFormLabels>) {
    this.#labels = { ...DEFAULT_LABELS, ...labels };
    this.#render();
  }

  get labels(): InvoiceFormLabels {
    return { ...this.#labels };
  }

  get value(): InvoiceFormValue {
    return { ...this.#value };
  }

  validate(): boolean {
    this.#validation = validateInvoiceForm(this.#value);
    this.#render();
    this.dispatchEvent(
      new CustomEvent("nettefatura-validity-change", {
        detail: { valid: this.#validation.valid },
        bubbles: true,
        composed: true,
      }),
    );
    return this.#validation.valid;
  }

  toNetteFaturaReceiver(): NetteFaturaReceiver {
    return mapToNetteFaturaReceiver(this.#value);
  }

  reset(): void {
    this.#clearValue(false);
    void this.#controller?.selectProvince("");
    this.#render();
    this.#emitChange();
  }

  #rebuildController(): void {
    this.#controller = new InvoiceDataController({
      locationProvider: this.#locationProvider,
      taxOfficeProvider: this.#taxOfficeProvider,
      onStateChange: (state) => {
        this.#dataState = state;
        this.#render();
        if (state.error && state.error !== this.#lastError) {
          this.dispatchEvent(
            new CustomEvent("nettefatura-error", {
              detail: {
                source: state.error,
                message: this.#labels.providerError,
              },
              bubbles: true,
              composed: true,
            }),
          );
        }
        this.#lastError = state.error;
      },
    });
    this.#dataState = this.#controller.state;
    void this.#controller.loadLocations();
  }

  readonly #handleChange = (event: Event): void => {
    const control = event.target;
    if (!(
      control instanceof HTMLInputElement ||
      control instanceof HTMLSelectElement ||
      control instanceof HTMLTextAreaElement
    )) {
      return;
    }

    const name = control.name;
    if (name === "corporateInvoice" && control instanceof HTMLInputElement) {
      if (control.checked) {
        this.#value.corporateInvoice = true;
      } else {
        this.#clearValue(false);
        void this.#controller?.selectProvince("");
      }
      this.#validation = { valid: true, errors: {} };
      this.#render();
      this.#emitChange();
      return;
    }

    if (!this.#value.corporateInvoice) return;

    switch (name) {
      case "companyName":
      case "taxId":
      case "billingAddress":
        this.#value[name] = control.value;
        break;
      case "provinceCode": {
        const province = this.#dataState?.provinces.find(
          (item) => item.code === control.value,
        );
        this.#value.provinceCode = province?.code ?? "";
        this.#value.provinceName = province?.name ?? "";
        this.#value.districtCode = "";
        this.#value.districtName = "";
        this.#value.taxOfficeCode = "";
        this.#value.taxOfficeName = "";
        void this.#controller?.selectProvince(this.#value.provinceCode);
        break;
      }
      case "districtCode": {
        const district = this.#dataState?.districts.find(
          (item) => item.code === control.value,
        );
        this.#controller?.selectDistrict(control.value);
        this.#value.districtCode = district?.code ?? "";
        this.#value.districtName = district?.name ?? "";
        break;
      }
      case "taxOfficeCode": {
        const office = this.#dataState?.taxOffices.find(
          (item) => item.code === control.value,
        );
        this.#controller?.selectTaxOffice(control.value);
        this.#value.taxOfficeCode = office?.code ?? "";
        this.#value.taxOfficeName = office?.name ?? "";
        break;
      }
    }

    this.#validation = { valid: true, errors: {} };
    this.#render();
    this.#emitChange();
  };

  readonly #handleClick = (event: Event): void => {
    const target = event.target;
    if (
      !(target instanceof HTMLButtonElement) ||
      target.dataset.action !== "retry-tax-offices"
    ) {
      return;
    }
    void this.#controller?.retryTaxOffices();
  };

  #clearValue(corporateInvoice: boolean): void {
    this.#value = { ...EMPTY_VALUE, corporateInvoice };
    this.#validation = { valid: true, errors: {} };
  }

  #emitChange(): void {
    this.dispatchEvent(
      new CustomEvent("nettefatura-change", {
        detail: this.value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  #render(): void {
    if (!this.shadowRoot) return;
    const labels = this.#labels;
    const data = this.#dataState;
    const errors = this.#validation.errors;
    const isExpanded = this.#value.corporateInvoice;

    this.shadowRoot.innerHTML = `
      <style>${componentStyles}</style>
      <section part="container">
        <label part="toggle-label" for="${this.#id("corporateInvoice")}">
          <input id="${this.#id("corporateInvoice")}" type="checkbox" name="corporateInvoice" ${isExpanded ? "checked" : ""} />
          <span>${escapeHtml(labels.toggle)}</span>
        </label>
        ${isExpanded ? this.#renderForm(data, errors) : ""}
      </section>
    `;
  }

  #renderForm(
    data: InvoiceDataState | null,
    errors: ValidationResult["errors"],
  ): string {
    const labels = this.#labels;
    const provinces = data?.provinces ?? [];
    const districts = data?.districts ?? [];
    const taxOffices = data?.taxOffices ?? [];
    const taxOfficeLoading = data?.taxOfficeStatus === "loading";
    const taxOfficeError = data?.taxOfficeStatus === "error";

    return `
      <div data-form part="form">
        ${this.#renderInput("companyName", labels.companyName, labels.companyNamePlaceholder, errors.companyName)}
        ${this.#renderInput("taxId", labels.taxId, labels.taxIdPlaceholder, errors.taxId, "numeric")}
        ${this.#renderSelect("provinceCode", labels.province, labels.provincePlaceholder, provinces, this.#value.provinceCode, errors.provinceCode, data?.locationStatus === "loading")}
        ${this.#renderSelect("districtCode", labels.district, labels.districtPlaceholder, districts, this.#value.districtCode, errors.districtCode, !this.#value.provinceCode)}
        ${this.#renderSelect("taxOfficeCode", labels.taxOffice, taxOfficeLoading ? labels.loading : labels.taxOfficePlaceholder, taxOffices, this.#value.taxOfficeCode, errors.taxOfficeCode, !this.#value.provinceCode || taxOfficeLoading || taxOfficeError)}
        ${taxOfficeError ? `<p role="alert" data-provider-error>${escapeHtml(labels.providerError)} <button type="button" data-action="retry-tax-offices">${escapeHtml(labels.retry)}</button></p>` : ""}
        <label data-field="billingAddress" for="${this.#id("billingAddress")}">
          <span>${escapeHtml(labels.billingAddress)}</span>
          <textarea id="${this.#id("billingAddress")}" name="billingAddress" rows="4" placeholder="${escapeHtml(labels.billingAddressPlaceholder)}" ${this.#errorAttributes("billingAddress", errors.billingAddress)}>${escapeHtml(this.#value.billingAddress)}</textarea>
          ${this.#renderError("billingAddress", errors.billingAddress)}
        </label>
      </div>
    `;
  }

  #renderInput(
    name: "companyName" | "taxId",
    label: string,
    placeholder: string,
    error: ValidationResult["errors"][typeof name],
    inputMode = "text",
  ): string {
    return `
      <label data-field="${name}" for="${this.#id(name)}">
        <span>${escapeHtml(label)}</span>
        <input id="${this.#id(name)}" name="${name}" value="${escapeHtml(this.#value[name])}" placeholder="${escapeHtml(placeholder)}" inputmode="${inputMode}" ${this.#errorAttributes(name, error)} />
        ${this.#renderError(name, error)}
      </label>
    `;
  }

  #renderSelect(
    name: "provinceCode" | "districtCode" | "taxOfficeCode",
    label: string,
    placeholder: string,
    options: readonly { code: string; name: string }[],
    selected: string,
    error: ValidationResult["errors"][typeof name],
    disabled = false,
  ): string {
    return `
      <label data-field="${name}" for="${this.#id(name)}">
        <span>${escapeHtml(label)}</span>
        <select id="${this.#id(name)}" name="${name}" ${disabled ? "disabled" : ""} ${this.#errorAttributes(name, error)}>
          <option value="">${escapeHtml(placeholder)}</option>
          ${options.map((option) => `<option value="${escapeHtml(option.code)}" ${selected === option.code ? "selected" : ""}>${escapeHtml(option.name)}</option>`).join("")}
        </select>
        ${this.#renderError(name, error)}
      </label>
    `;
  }

  #renderError(
    name: keyof ValidationResult["errors"],
    error: ValidationResult["errors"][keyof ValidationResult["errors"]],
  ): string {
    if (!error) return "";
    const message =
      error === "invalid"
        ? this.#labels.invalidTaxIdError
        : this.#labels.requiredError;
    return `<small id="${this.#errorId(name)}" role="alert">${escapeHtml(message)}</small>`;
  }

  #errorAttributes(
    name: keyof ValidationResult["errors"],
    error: ValidationResult["errors"][keyof ValidationResult["errors"]],
  ): string {
    return error
      ? `aria-invalid="true" aria-describedby="${this.#errorId(name)}"`
      : "";
  }

  #id(name: string): string {
    return `${this.#idPrefix}-${name}`;
  }

  #errorId(name: string): string {
    return `${this.#id(name)}-error`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
