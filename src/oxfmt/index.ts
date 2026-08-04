// @concertypin/config/oxfmt — Shared Oxfmt formatting contract

import type { OxfmtConfig } from "oxfmt";

const config: OxfmtConfig = {
    arrowParens: "always",
    endOfLine: "lf",
    printWidth: 80,
    semi: true,
    singleQuote: false,
    sortPackageJson: false,
    tabWidth: 4,
    trailingComma: "es5",
    useTabs: false,
    overrides: [
        {
            files: ["*.yaml", "*.yml"],
            options: {
                tabWidth: 2,
            },
        },
        {
            files: ["*.jsonc"],
            options: {
                trailingComma: "none",
            },
        },
    ],
};

export default config;
