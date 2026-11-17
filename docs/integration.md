# Integration Guide

This guide connects `nettefatura-invoice-form` to different frontend stacks. In every case, assign the providers as JavaScript properties; functions cannot be expressed as HTML attributes.

## Provider contracts

```ts
type District = { code: string; name: string };
type Province = { code: string; name: string; districts: District[] };
type TaxOffice = { code: string; name: string };

type LocationProvider = () => Promise<Province[]>;
type TaxOfficeProvider = (provinceCode: string) => Promise<TaxOffice[]>;
```

Normalize your source data at the provider boundary. Keep codes as strings so leading zeroes are preserved.

## Plain HTML

```html
<nettefatura-invoice-form id="invoice-form"></nettefatura-invoice-form>

<script type="module">
  import "nettefatura-invoice-form";

  const form = document.querySelector("#invoice-form");
  form.locationProvider = () => fetch("/api/locations").then(assertJson);
  form.taxOfficeProvider = (provinceCode) =>
    fetch(`/api/nettefatura/tax-offices?provinceCode=${provinceCode}`).then(
      assertJson,
    );

  form.addEventListener("nettefatura-change", (event) => {
    checkoutState.invoice = event.detail;
  });

  function assertJson(response) {
    if (!response.ok) throw new Error("Lookup failed");
    return response.json();
  }
</script>
```

## React

React can render the custom element directly. Assign function properties in an effect.

```tsx
"use client";

import "nettefatura-invoice-form";
import { useEffect, useRef } from "react";
import type { NetteFaturaInvoiceForm } from "nettefatura-invoice-form";

export function CorporateInvoiceFields() {
  const formRef = useRef<NetteFaturaInvoiceForm>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    form.locationProvider = () => fetch("/api/locations").then(readJson);
    form.taxOfficeProvider = (provinceCode) =>
      fetch(`/api/nettefatura/tax-offices?provinceCode=${provinceCode}`).then(
        readJson,
      );
  }, []);

  return <nettefatura-invoice-form ref={formRef} />;
}
```

Add a JSX declaration if your project does not infer Custom Elements:

```ts
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "nettefatura-invoice-form": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
```

## Next.js

Load the package only in a Client Component because Custom Elements require the browser's `customElements` registry. Use the React pattern above in a file containing `'use client'`. Keep NetteFatura requests in Route Handlers or another server-only service.

## Vue

```vue
<script setup lang="ts">
import "nettefatura-invoice-form";
import { onMounted, ref } from "vue";
import type { NetteFaturaInvoiceForm } from "nettefatura-invoice-form";

const invoiceForm = ref<NetteFaturaInvoiceForm>();

onMounted(() => {
  if (!invoiceForm.value) return;
  invoiceForm.value.locationProvider = () =>
    fetch("/api/locations").then((response) => response.json());
  invoiceForm.value.taxOfficeProvider = (provinceCode) =>
    fetch(`/api/nettefatura/tax-offices?provinceCode=${provinceCode}`).then(
      (response) => response.json(),
    );
});
</script>

<template>
  <nettefatura-invoice-form ref="invoiceForm" />
</template>
```

Configure Vue to recognize the tag as a Custom Element when compiling templates.

## Checkout submission

Validate immediately before the host checkout submits:

```ts
if (!form.validate()) {
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  return;
}

const receiver = form.toNetteFaturaReceiver();
await fetch("/api/orders", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ order, invoiceReceiver: receiver }),
});
```

Calling `reset()` clears all invoice fields and collapses the component. Reading `value` returns a snapshot rather than the internal mutable object.

## Events

- `nettefatura-change`: synchronize the current form value with checkout state.
- `nettefatura-validity-change`: react to a `validate()` result.
- `nettefatura-error`: show or monitor a safe provider failure without exposing its internal exception.

Do not send field contents to analytics or error-monitoring tools.
