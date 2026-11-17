# NetteFatura Invoice Form Design

## Intent

Build a reusable corporate-invoice form that a developer can add to any Turkish website and connect to an existing NetteFatura backend. The repository and developer documentation are in English; the default customer-facing labels are Turkish.

## Goals

- Provide a framework-agnostic Web Component named `nettefatura-invoice-form`.
- Reveal the form when the customer selects “Kurumsal fatura istiyorum”.
- Collect company name, VKN/TCKN, province, district, tax office, and a free-form billing address.
- Filter districts by province and tax offices by province.
- Emit clean form data and expose a mapper for NetteFatura receiver/address fields.
- Allow host sites to supply province/district and tax-office data through configurable providers.
- Include a runnable plain-HTML example and integration guidance for React, Vue, Next.js, and server-rendered sites.
- Publish the source on GitHub with an MIT license and a detailed English README.

## Non-goals

- Sending invoices directly from the browser.
- Storing customer or invoice data.
- Bundling private email, company, credential, or official-service documents.
- Replacing the NetteFatura SDK or backend integration.
- Asking customers to select neighbourhood, street, exterior-door, or interior-door values separately.

## Constraints

- NetteFatura SOAP calls remain server-side because access depends on IP–VKN matching.
- The component must not require React, Vue, or another UI framework.
- The address text area explains that neighbourhood, street, building, exterior-door, and interior-door details belong in one field.
- Province selection resets district and tax-office values; dependent choices cannot remain stale.
- The host can override all visible labels and data-loading functions.
- Third-party datasets are not copied into the repository unless their license is compatible and attribution is preserved.

## Approaches considered

1. **Framework-agnostic Web Component with provider hooks — selected.** Works in plain HTML and modern frameworks, keeps NetteFatura calls on the host backend, and avoids coupling the package to one application stack.
2. **React-only package.** Faster for React projects but unsuitable for WordPress, Vue, or plain HTML consumers.
3. **Hosted iframe service.** Easy to embed but harder to style and introduces an unnecessary external processor for invoice data.

## Component contract

- Custom element: `nettefatura-invoice-form`.
- Properties:
  - `locationProvider: () => Promise<Province[]>`
  - `taxOfficeProvider: (provinceCode: string) => Promise<TaxOffice[]>`
  - `labels: Partial<InvoiceFormLabels>`
  - `value: InvoiceFormValue` (read-only snapshot)
- Methods:
  - `validate(): boolean`
  - `toNetteFaturaReceiver(): NetteFaturaReceiver`
  - `reset(): void`
- Events:
  - `nettefatura-change` with `InvoiceFormValue`
  - `nettefatura-validity-change` with `{ valid: boolean }`
  - `nettefatura-error` with a safe, user-displayable provider error

## Data model

`InvoiceFormValue` contains `corporateInvoice`, `companyName`, `taxId`, `provinceCode`, `provinceName`, `districtCode`, `districtName`, `taxOfficeCode`, `taxOfficeName`, and `billingAddress`.

The NetteFatura mapping uses `ReceiverName`, `ReceiverTaxCode`, and an `Address` object containing `BoulevardAveneuStreetName`, `CityCode`, `CityName`, `TownCode`, `TownName`, `TaxOfficeCode`, `TaxOfficeName`, and `CountryName: "TÜRKİYE"`.

## User experience

The collapsed state shows only a checkbox. Once selected, the form follows the visual hierarchy of the supplied reference: company name on its own row; VKN/TCKN and tax office in a responsive row; province and district in a responsive row; billing address last as a full-width text area. Loading, empty, invalid, and provider-error states are visible and accessible.

## Security and privacy

The browser component never receives NetteFatura credentials and never performs SOAP calls. It does not log or persist form values. Documentation instructs integrators to validate the payload again on the server and to expose only a narrow tax-office lookup endpoint.
