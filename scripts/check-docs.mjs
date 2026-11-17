import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "docs/integration.md",
  "docs/nettefatura-backend.md",
  "examples/plain-html/index.html",
  "examples/plain-html/main.ts",
];

const requiredPublicApi = [
  "locationProvider",
  "taxOfficeProvider",
  "labels",
  "value",
  "validate()",
  "toNetteFaturaReceiver()",
  "reset()",
  "nettefatura-change",
  "nettefatura-validity-change",
  "nettefatura-error",
];

const missingFiles = requiredFiles.filter((file) => !existsSync(file));
if (missingFiles.length > 0) {
  throw new Error(`Missing documentation files: ${missingFiles.join(", ")}`);
}

const documentation = [
  readFileSync("README.md", "utf8"),
  readFileSync("docs/integration.md", "utf8"),
  readFileSync("docs/nettefatura-backend.md", "utf8"),
].join("\n");

const missingApi = requiredPublicApi.filter(
  (name) => !documentation.includes(name),
);
if (missingApi.length > 0) {
  throw new Error(`Undocumented public API: ${missingApi.join(", ")}`);
}

console.log(
  `Documentation check passed: ${requiredFiles.length} files, ${requiredPublicApi.length} public API entries.`,
);
