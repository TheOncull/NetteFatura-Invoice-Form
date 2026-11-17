# NetteFatura Backend Integration

The form must not call NetteFatura SOAP services directly. A browser cannot safely own a static approved IP/VKN relationship, and client-side requests expose integration details to every visitor.

## Recommended endpoints

Expose only the narrow operations needed by the browser:

```text
GET /api/locations
GET /api/nettefatura/tax-offices?provinceCode=34
POST /api/orders
```

`GET /api/locations` returns your maintained province/district dataset. `GET /api/nettefatura/tax-offices` validates a province code and proxies the NetteFatura AddressBook tax-office lookup. Invoice creation happens only as part of the authenticated server-side order workflow.

## Response shapes

```json
[
  {
    "code": "34",
    "name": "İstanbul",
    "districts": [{ "code": "1103", "name": "Kadıköy" }]
  }
]
```

```json
[{ "code": "034225", "name": "Kadıköy Vergi Dairesi" }]
```

Return an empty array for a valid province with no results. Return a non-2xx status for provider failure; the component will emit `nettefatura-error` and offer a retry.

## Example route

The exact SDK method can differ. This Express-style example uses the interface demonstrated by the community `nettefatura-api` package:

```ts
import express from "express";
import { NetteFaturaClient } from "nettefatura-api";

const app = express();
const client = new NetteFaturaClient({
  companyTaxCode: process.env.NETTEFATURA_COMPANY_TAX_CODE!,
  environment: process.env.NODE_ENV === "production" ? "production" : "test",
});

app.get("/api/nettefatura/tax-offices", async (request, response) => {
  const provinceCode = String(request.query.provinceCode ?? "");
  if (!/^\d{1,2}$/.test(provinceCode)) {
    response.status(400).json({ error: "Invalid province code" });
    return;
  }

  try {
    const result = await client.addressBook.getTaxOfficeList({
      CityCode: Number(provinceCode),
    });

    const offices = (result.TaxOfficeList ?? []).map((office) => ({
      code: String(office.TaxOfficeCode),
      name: String(office.TaxOfficeName),
    }));

    response.json(offices);
  } catch {
    response.status(502).json({ error: "Tax-office lookup unavailable" });
  }
});
```

Confirm property names against the SDK version you install. Do not return raw SOAP errors to the browser.

## Server-side validation

Before creating an invoice:

1. Require the company name and billing address.
2. validate VKN/TCKN again using a trusted server-side implementation.
3. Confirm the province, district, and tax-office codes exist in your current sources.
4. Normalize whitespace but do not silently rewrite legal company names or addresses.
5. Associate the data with the authenticated order, not a browser-supplied order identifier.
6. Apply request size limits and rate limits.

The component's `toNetteFaturaReceiver()` method maps the browser value to `ReceiverName`, `ReceiverTaxCode`, and the NetteFatura `Address` fields. Treat that mapping as input, not trusted data.

## IP–VKN setup

NetteFatura's SOAP service uses server IP and company VKN/TCKN matching. Coordinate test and production access with your NetteFatura account contact. Use a static outbound IP where required and separate test configuration from production.

Never commit:

- private integration emails or PDF documentation;
- real company/customer identifiers;
- environment files, credentials, raw invoices, or SOAP logs;
- production endpoints that are not intended to be public.

## WebSellingInfo and Carrier

If your invoice workflow sends `WebSellingInfo`, ensure the corresponding `Carrier` structure is populated as required by your NetteFatura service agreement and current interface documentation. This form intentionally does not guess carrier data because it belongs to the merchant's delivery/order flow rather than the customer's billing address.

## Observability

Log request IDs, provider status, duration, and sanitized error categories. Do not log VKN/TCKN, company names, street addresses, SOAP bodies, or complete invoice payloads.
