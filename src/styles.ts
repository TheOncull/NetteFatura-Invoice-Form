export const componentStyles = `
  :host {
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
    display: block;
    color: var(--nf-text);
    font-family: Aptos, "Segoe UI", system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.45;
  }

  *, *::before, *::after { box-sizing: border-box; }

  [part="container"] {
    border: 1px solid var(--nf-border);
    border-radius: var(--nf-radius);
    background: var(--nf-surface);
    padding: clamp(20px, 3vw, 32px);
  }

  [part="toggle-label"] {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    width: fit-content;
    color: var(--nf-text);
    font-size: clamp(18px, 2.1vw, 22px);
    font-weight: 700;
    cursor: pointer;
  }

  [name="corporateInvoice"] {
    appearance: none;
    display: grid;
    place-content: center;
    width: 28px;
    height: 28px;
    margin: 0;
    border: 2px solid var(--nf-border-strong);
    border-radius: 8px;
    background: var(--nf-surface);
    cursor: pointer;
  }

  [name="corporateInvoice"]::before {
    content: "";
    width: 13px;
    height: 7px;
    border: solid #ffffff;
    border-width: 0 0 2px 2px;
    transform: translateY(-1px) rotate(-45deg) scale(0);
    transition: transform 140ms ease-out;
  }

  [name="corporateInvoice"]:checked {
    border-color: var(--nf-accent);
    background: var(--nf-accent);
  }

  [name="corporateInvoice"]:checked::before { transform: translateY(-1px) rotate(-45deg) scale(1); }

  [part="form"] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "company company"
      "tax taxoffice"
      "province district"
      "address address";
    gap: 20px 18px;
    margin-top: 28px;
  }

  [data-field="companyName"] { grid-area: company; }
  [data-field="taxId"] { grid-area: tax; }
  [data-field="provinceCode"] { grid-area: province; }
  [data-field="districtCode"] { grid-area: district; }
  [data-field="taxOfficeCode"] { grid-area: taxoffice; }
  [data-field="billingAddress"] { grid-area: address; }

  label[data-field] {
    display: grid;
    align-content: start;
    gap: 8px;
    min-width: 0;
    font-weight: 650;
  }

  input:not([type="checkbox"]), select, textarea {
    width: 100%;
    min-height: 54px;
    border: 1px solid var(--nf-border);
    border-radius: var(--nf-control-radius);
    background: var(--nf-surface);
    color: var(--nf-text);
    font: inherit;
    font-weight: 450;
    padding: 13px 16px;
    outline: none;
    transition: border-color 140ms ease-out, box-shadow 140ms ease-out;
  }

  textarea { min-height: 116px; resize: vertical; }
  select { cursor: pointer; }
  select:disabled { cursor: not-allowed; background: #f7f8f9; color: var(--nf-muted); }
  ::placeholder { color: #8a939d; opacity: 1; }

  input:not([type="checkbox"]):focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  [name="corporateInvoice"]:focus-visible,
  button:focus-visible {
    border-color: var(--nf-accent-strong);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--nf-accent) 22%, transparent);
  }

  [aria-invalid="true"] { border-color: var(--nf-error) !important; }

  small[role="alert"] {
    color: var(--nf-error);
    font-size: 13px;
    font-weight: 550;
  }

  [data-provider-error] {
    grid-column: 1 / -1;
    margin: -8px 0 0;
    color: var(--nf-error);
    font-size: 14px;
  }

  button {
    border: 0;
    background: transparent;
    color: var(--nf-accent-strong);
    font: inherit;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    [part="container"] { border-radius: 17px; padding: 18px; }
    [part="form"] {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "company"
        "tax"
        "province"
        "district"
        "taxoffice"
        "address";
      gap: 17px;
      margin-top: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0.01ms !important; }
  }
`;
