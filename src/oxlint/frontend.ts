// @concertypin/config/oxlint/frontend — Base plus React/Solid common delta
// Adds `typescript/no-deprecated: error` and `no-console: warn`,
// the shared general-rule delta used by the React and Solid templates.

import base from "./index.js";

import type { OxlintConfig } from "oxlint";

const config: OxlintConfig = {
    ...base,
    rules: {
        ...base.rules,
        "typescript/no-deprecated": "error",
        "no-console": "warn",
    },
};

export default config;
