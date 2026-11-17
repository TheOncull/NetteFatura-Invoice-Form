import type { Province, TaxOffice } from "../../src";

export const provinces: Province[] = [
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
  {
    code: "07",
    name: "Antalya",
    districts: [{ code: "2036", name: "Muratpaşa" }],
  },
];

export const taxOffices: Record<string, TaxOffice[]> = {
  "34": [
    { code: "034225", name: "Kadıköy Vergi Dairesi" },
    { code: "034226", name: "Boğaziçi Kurumlar Vergi Dairesi" },
  ],
  "06": [{ code: "006201", name: "Ankara Vergi Dairesi" }],
  "07": [{ code: "007251", name: "Muratpaşa Vergi Dairesi" }],
};
