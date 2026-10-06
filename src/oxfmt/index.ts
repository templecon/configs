// @concertypin/config/oxfmt — Shared Oxfmt formatting contract

import type { OxfmtConfig } from "oxfmt";

const defaults: OxfmtConfig = {
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
        {
            files: [
                "src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
                "tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
            ],
            options: {
                sortImports: {
                    partitionByComment: true,
                },
            },
        },
    ],
};

export default function createOxfmtConfig(): OxfmtConfig {
    return {
        ...defaults,
        overrides: [...(defaults.overrides ?? [])],
    };
}
