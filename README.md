# NetteFatura Invoice Form

A framework-agnostic Web Component for collecting corporate invoice details on Turkish websites that use NetteFatura.

The component gives a checkout or registration flow a ready-made **“Kurumsal fatura istiyorum”** option, dependent province/district/tax-office selectors, Turkish VKN/TCKN validation, and a typed mapping to the receiver structure expected by NetteFatura integrations.

> This project is a customer-facing form and mapping layer. It is not an official İşNet or NetteFatura product, and it does not send SOAP requests from the browser.

## Why this component exists

Every NetteFatura integration needs nearly the same corporate-invoice form. Reimplementing that form in each storefront creates inconsistent validation, address payloads, and security boundaries. This package keeps the browser portion reusable while leaving NetteFatura access on the website's own server.

## Features

- Works with plain HTML, React, Vue, Next.js, and other environments that support Custom Elements.
- Uses native browser controls and Shadow DOM; no UI framework runtime is required.
- Shows the detailed form only when corporate invoicing is selected.
- Collects company name, VKN/TCKN, province, district, tax office, and one free-form billing address.
- Filters districts and tax offices when the province changes.
- Prevents stale asynchronous tax-office responses from replacing a newer province selection.
- Validates Turkish VKN and TCKN checksums.
- Produces a typed NetteFatura receiver/address object.
- Provides accessible labels, keyboard focus, error announcements, and a responsive mobile layout.
- Supports custom labels and CSS variables.
- Does not store, log, or transmit customer data by itself.

## Security boundary

NetteFatura SOAP access uses server-side IP–VKN matching. Keep that integration on your server.

```text
Customer browser                 Your website server                 NetteFatura
┌────────────────────┐          ┌────────────────────────┐          ┌─────────────┐
│ Invoice form       │  HTTPS   │ Validate again         │   SOAP   │ AddressBook │
│ Public lookup data ├─────────►│ Tax-office proxy       ├─────────►│ Invoice API │
│ No SOAP access     │          │ Static approved IP/VKN │          │             │
└────────────────────┘          └────────────────────────┘          └─────────────┘
```

Never expose SOAP endpoints, internal documents, server configuration, or customer invoice payloads through public client code. See [NetteFatura backend integration](docs/nettefatura-backend.md) and [Security](SECURITY.md).

## Installation

The package is currently distributed from GitHub:

```bash
pnpm add github:TheOncull/NetteFatura-Invoice-Form
```

Or build it from source:

```bash
git clone https://github.com/TheOncull/NetteFatura-Invoice-Form.git
cd NetteFatura-Invoice-Form
pnpm install
pnpm build
```

Node.js 20 or newer is required for development. The built browser component itself has no Node.js runtime dependency.

## Quick start

```html
<nettefatura-invoice-form></nettefatura-invoice-form>

<script type="module">
  import "nettefatura-invoice-form";

  const form = document.querySelector("nettefatura-invoice-form");

  form.locationProvider = async () =>
    fetch("/api/locations").then((response) => response.json());

  form.taxOfficeProvider = async (provinceCode) =>
    fetch(`/api/nettefatura/tax-offices?provinceCode=${provinceCode}`).then(
      (response) => response.json(),
    );

  form.addEventListener("nettefatura-change", (event) => {
    console.log(event.detail);
  });
</script>
```

The host website supplies two providers:

- `locationProvider`: returns provinces with their districts.
- `taxOfficeProvider`: returns tax offices for one province code, normally through a narrow server-side NetteFatura lookup endpoint.

The package intentionally does not bundle an unversioned national address database. Your application remains responsible for choosing and updating a licensed location source. The runnable example contains only a small mock dataset.

## Form value

Read the current immutable snapshot through `value` or listen for `nettefatura-change`:

```ts
const value = form.value;

// {
//   corporateInvoice: true,
//   companyName: 'Example Technology A.Ş.',
//   taxId: '1000000018',
//   provinceCode: '34',
//   provinceName: 'İstanbul',
//   districtCode: '1103',
//   districtName: 'Kadıköy',
//   taxOfficeCode: '034225',
//   taxOfficeName: 'Kadıköy Vergi Dairesi',
//   billingAddress: 'Caferağa Mah. Moda Cad. No: 10 D: 4'
// }
```

The example numbers are synthetic test data. Do not copy them into real invoices.

## Mapping to NetteFatura

Call `validate()` before mapping. It displays field errors and returns a boolean.

```ts
if (form.validate()) {
  const receiver = form.toNetteFaturaReceiver();
  await submitOrder({ receiver });
}
```

`toNetteFaturaReceiver()` returns:

```ts
{
  ReceiverName: string;
  ReceiverTaxCode: string;
  Address: {
    BoulevardAveneuStreetName: string;
    CityCode: string;
    CityName: string;
    TownCode: string;
    TownName: string;
    TaxOfficeCode: string;
    TaxOfficeName: string;
    CountryName: "TÜRKİYE";
  }
}
```

Always validate this object again on the server. Browser validation improves the experience; it is not a security control.

## Public API

### Properties

| Property            | Type                                             | Purpose                                       |
| ------------------- | ------------------------------------------------ | --------------------------------------------- |
| `locationProvider`  | `() => Promise<Province[]>`                      | Loads provinces and nested districts.         |
| `taxOfficeProvider` | `(provinceCode: string) => Promise<TaxOffice[]>` | Loads tax offices after a province selection. |
| `labels`            | `Partial<InvoiceFormLabels>`                     | Replaces individual customer-facing labels.   |
| `value`             | `InvoiceFormValue`                               | Returns a fresh snapshot of the form.         |

### Methods

| Method                    | Result                | Purpose                                                |
| ------------------------- | --------------------- | ------------------------------------------------------ |
| `validate()`              | `boolean`             | Validates and displays accessible field errors.        |
| `toNetteFaturaReceiver()` | `NetteFaturaReceiver` | Maps a complete form to NetteFatura receiver fields.   |
| `reset()`                 | `void`                | Clears the form and returns it to the collapsed state. |

### Events

All events bubble and cross the Shadow DOM boundary.

| Event                         | `detail`                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `nettefatura-change`          | `InvoiceFormValue`                                          |
| `nettefatura-validity-change` | `{ valid: boolean }`                                        |
| `nettefatura-error`           | `{ source: 'locations' \| 'tax-offices', message: string }` |

## Custom labels

The default customer-facing text is Turkish. Developer documentation and source identifiers are English.

```ts
form.labels = {
  toggle: "I need a corporate invoice",
  companyName: "Legal company name",
  billingAddress: "Registered billing address",
};
```

## Styling

The component exposes CSS custom properties so it can follow the host site's visual system:

```css
nettefatura-invoice-form {
  --nf-surface: #ffffff;
  --nf-text: #30353b;
  --nf-muted: #667085;
  --nf-border: #d9dee3;
  --nf-border-strong: #b7c0c9;
  --nf-accent: #12b76a;
  --nf-accent-strong: #067647;
  --nf-error: #b42318;
  --nf-radius: 22px;
  --nf-control-radius: 13px;
}
```

Shadow parts `container`, `toggle-label`, and `form` are also available for controlled advanced customization.

## Framework guides

See [Integration guide](docs/integration.md) for plain HTML, React, Vue, and Next.js examples.

## Run the example

```bash
pnpm install
pnpm vite
```

Open `http://localhost:5173/examples/plain-html/`.

The example uses local mock data and never sends customer information anywhere.

## Development

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm docs:check
```

## Data-source guidance

Province and district names change over time, and tax-office lists are service data. Prefer a maintained, licensed source and record its version. One possible openly licensed administrative dataset is [`open-admin-data/turkey-administrative-divisions`](https://github.com/open-admin-data/turkey-administrative-divisions) (CC BY 4.0). Review its license and freshness before use.

For tax offices, the recommended source is the NetteFatura AddressBook service through your own backend. A community TypeScript SDK that demonstrates this service is [`EfeSorogluu/NetteFatura-API`](https://github.com/EfeSorogluu/NetteFatura-API). Evaluate third-party packages independently before production use.

## Privacy

Invoice fields are personal and commercial data. This component keeps values in memory only. The host application decides when and where data is sent, stored, retained, and deleted. Your implementation must provide the required privacy notice and follow applicable law.

## License

[MIT](LICENSE) © 2026 TheOncull
