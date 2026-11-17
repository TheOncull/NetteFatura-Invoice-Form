import type {
  District,
  LocationProvider,
  Province,
  TaxOffice,
  TaxOfficeProvider,
} from "./types";

export type DataStatus = "idle" | "loading" | "ready" | "error";
export type DataError = "locations" | "tax-offices" | null;

export interface InvoiceDataState {
  readonly provinces: readonly Province[];
  readonly districts: readonly District[];
  readonly taxOffices: readonly TaxOffice[];
  readonly selectedProvinceCode: string;
  readonly selectedDistrictCode: string;
  readonly selectedTaxOfficeCode: string;
  readonly locationStatus: DataStatus;
  readonly taxOfficeStatus: DataStatus;
  readonly error: DataError;
}

interface InvoiceDataControllerOptions {
  locationProvider: LocationProvider;
  taxOfficeProvider: TaxOfficeProvider;
  onStateChange?: (state: InvoiceDataState) => void;
}

interface MutableState {
  provinces: Province[];
  districts: District[];
  taxOffices: TaxOffice[];
  selectedProvinceCode: string;
  selectedDistrictCode: string;
  selectedTaxOfficeCode: string;
  locationStatus: DataStatus;
  taxOfficeStatus: DataStatus;
  error: DataError;
}

export class InvoiceDataController {
  readonly #locationProvider: LocationProvider;
  readonly #taxOfficeProvider: TaxOfficeProvider;
  readonly #onStateChange: ((state: InvoiceDataState) => void) | undefined;
  #taxOfficeRequest = 0;
  #state: MutableState = {
    provinces: [],
    districts: [],
    taxOffices: [],
    selectedProvinceCode: "",
    selectedDistrictCode: "",
    selectedTaxOfficeCode: "",
    locationStatus: "idle",
    taxOfficeStatus: "idle",
    error: null,
  };

  constructor(options: InvoiceDataControllerOptions) {
    this.#locationProvider = options.locationProvider;
    this.#taxOfficeProvider = options.taxOfficeProvider;
    this.#onStateChange = options.onStateChange;
  }

  get state(): InvoiceDataState {
    return freezeState(this.#state);
  }

  async loadLocations(): Promise<void> {
    this.#state.locationStatus = "loading";
    this.#state.error = null;
    this.#notify();

    try {
      this.#state.provinces = await this.#locationProvider();
      this.#state.locationStatus = "ready";
    } catch {
      this.#state.provinces = [];
      this.#state.locationStatus = "error";
      this.#state.error = "locations";
    }

    this.#notify();
  }

  async selectProvince(code: string): Promise<void> {
    this.#taxOfficeRequest += 1;
    const request = this.#taxOfficeRequest;
    const province = this.#state.provinces.find((item) => item.code === code);

    this.#state.selectedProvinceCode = province?.code ?? "";
    this.#state.selectedDistrictCode = "";
    this.#state.selectedTaxOfficeCode = "";
    this.#state.districts = province?.districts ?? [];
    this.#state.taxOffices = [];
    this.#state.taxOfficeStatus = province ? "loading" : "idle";
    this.#state.error = null;
    this.#notify();

    if (!province) {
      return;
    }

    try {
      const taxOffices = await this.#taxOfficeProvider(province.code);
      if (request !== this.#taxOfficeRequest) {
        return;
      }
      this.#state.taxOffices = taxOffices;
      this.#state.taxOfficeStatus = "ready";
    } catch {
      if (request !== this.#taxOfficeRequest) {
        return;
      }
      this.#state.taxOffices = [];
      this.#state.taxOfficeStatus = "error";
      this.#state.error = "tax-offices";
    }

    this.#notify();
  }

  selectDistrict(code: string): void {
    this.#state.selectedDistrictCode = this.#state.districts.some(
      (district) => district.code === code,
    )
      ? code
      : "";
    this.#notify();
  }

  selectTaxOffice(code: string): void {
    this.#state.selectedTaxOfficeCode = this.#state.taxOffices.some(
      (office) => office.code === code,
    )
      ? code
      : "";
    this.#notify();
  }

  async retryTaxOffices(): Promise<void> {
    await this.selectProvince(this.#state.selectedProvinceCode);
  }

  #notify(): void {
    this.#onStateChange?.(this.state);
  }
}

function freezeState(state: MutableState): InvoiceDataState {
  const provinces = state.provinces.map((province) =>
    Object.freeze({
      ...province,
      districts: Object.freeze(
        province.districts.map((district) => Object.freeze({ ...district })),
      ) as District[],
    }),
  );
  const districts = state.districts.map((district) =>
    Object.freeze({ ...district }),
  );
  const taxOffices = state.taxOffices.map((office) =>
    Object.freeze({ ...office }),
  );

  return Object.freeze({
    ...state,
    provinces: Object.freeze(provinces),
    districts: Object.freeze(districts),
    taxOffices: Object.freeze(taxOffices),
  });
}
