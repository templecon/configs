import createFrontendOxlintConfig from "@concertypin/config/oxlint/frontend";
import type { OxlintConfig } from "oxlint";

export let value = 1;
value += 1;

createFrontendOxlintConfig({ tailwind: { entryPoint: "src/index.css" } });

// Consumers pass `settings` at the root because `extends` does not carry it.
// It must be defined so this compiles under `exactOptionalPropertyTypes`.
const frontend = createFrontendOxlintConfig({});
export const rootSettings: NonNullable<OxlintConfig["settings"]> =
    frontend.settings;
// The deprecated overload is deliberately exercised for compatibility.
// oxlint-disable-next-line typescript/no-deprecated
createFrontendOxlintConfig("src/index.css");
